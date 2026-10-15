package gitquery.backend.services.ai;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import gitquery.backend.dto.ChatMessageResponse;
import gitquery.backend.dto.CitationDto;
import gitquery.backend.entity.ChatMessage;
import gitquery.backend.entity.MessageRole;
import gitquery.backend.repository.ChatMessageRepository;
import gitquery.backend.services.UsageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Generation step: call the chat model through Spring AI and stream tokens to the
 * browser over SSE, recording token usage once the reply completes.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ChatStreamHandler {

    private final ChatModel chatModel;
    private final ChatMessageRepository chatMessageRepository;
    private final CitationMapper citationMapper;
    private final UsageService usageService;

    public SseEmitter stream(
            UUID sessionId,
            UUID userId,
            ChatMessageResponse savedUserMessage,
            List<CitationDto> citations,
            String systemPrompt,
            String userPrompt) {

        SseEmitter emitter = new SseEmitter(RagSettings.STREAM_TIMEOUT_MS);
        StringBuilder fullReply = new StringBuilder();

        // Usage arrives across several chunks and its shape varies by provider:
        // some report input tokens up front and output tokens only at the end, so
        // the highest value seen for each field is kept rather than the last.
        AtomicInteger inputTokens = new AtomicInteger();
        AtomicInteger outputTokens = new AtomicInteger();

        try {
            emitter.send(SseEmitter.event()
                    .name("user_message")
                    .data(savedUserMessage));

            ChatClient.builder(chatModel)
                    .build()
                    .prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .stream()
                    .chatResponse()
                    .doOnNext(response -> {
                        appendText(emitter, fullReply, response);
                        captureUsage(response, inputTokens, outputTokens);
                    })
                    .doOnError(err -> {
                        log.error("Chat stream error", err);
                        emitter.completeWithError(err);
                    })
                    .doOnComplete(() -> completeStream(
                            emitter,
                            sessionId,
                            userId,
                            fullReply,
                            citations,
                            inputTokens.get(),
                            outputTokens.get()))
                    .subscribe();
        } catch (Exception ex) {
            emitter.completeWithError(ex);
        }

        return emitter;
    }

    private void appendText(
            SseEmitter emitter,
            StringBuilder fullReply,
            ChatResponse response) {

        var generation = response.getResult();
        if (generation == null || generation.getOutput() == null) {
            return;
        }
        String text = generation.getOutput().getText();
        if (text == null || text.isEmpty()) {
            return;
        }
        appendToken(emitter, fullReply, text);
    }

    private void captureUsage(
            org.springframework.ai.chat.model.ChatResponse response,
            AtomicInteger inputTokens,
            AtomicInteger outputTokens) {

        var metadata = response.getMetadata();
        if (metadata == null) {
            return;
        }
        Usage usage = metadata.getUsage();
        if (usage == null) {
            return;
        }
        if (usage.getPromptTokens() != null) {
            inputTokens.accumulateAndGet(usage.getPromptTokens(), Math::max);
        }
        if (usage.getCompletionTokens() != null) {
            outputTokens.accumulateAndGet(usage.getCompletionTokens(), Math::max);
        }
    }

    private void appendToken(SseEmitter emitter, StringBuilder fullReply, String token) {
        fullReply.append(token);
        try {
            emitter.send(SseEmitter.event()
                    .name("token")
                    .data(token, MediaType.APPLICATION_JSON));
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private void completeStream(
            SseEmitter emitter,
            UUID sessionId,
            UUID userId,
            StringBuilder fullReply,
            List<CitationDto> citations,
            int inputTokens,
            int outputTokens) {
        try {
            // Recorded before the reply is persisted so the accounting is not lost
            // if saving the message fails.
            usageService.record(userId, inputTokens, outputTokens);

            ChatMessage assistant = chatMessageRepository.save(ChatMessage.builder()
                    .sessionId(sessionId)
                    .role(MessageRole.ASSISTANT)
                    .content(fullReply.toString())
                    .citations(citationMapper.toJson(citations))
                    .build());

            emitter.send(SseEmitter.event()
                    .name("assistant_message")
                    .data(toMessageResponse(assistant)));
            emitter.send(SseEmitter.event().name("done").data("[DONE]"));
            emitter.complete();
        } catch (Exception ex) {
            emitter.completeWithError(ex);
        }
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getRole(),
                message.getContent(),
                citationMapper.fromJson(message.getCitations()),
                message.getCreatedAt());
    }
}
