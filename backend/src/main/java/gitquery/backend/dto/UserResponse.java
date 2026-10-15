package gitquery.backend.dto;

import java.util.UUID;

/**
 * @param inputTokens  cumulative tokens sent to the model
 * @param outputTokens cumulative tokens received
 * @param usedUsd      {@code inputTokens} and {@code outputTokens} priced at list rates
 * @param includedUsd  the allowance {@code usedUsd} is measured against
 */
public record UserResponse(
        UUID id,
        Long githubId,
        String githubUsername,
        String displayName,
        String avatarUrl,
        long inputTokens,
        long outputTokens,
        double usedUsd,
        double includedUsd) {
}
