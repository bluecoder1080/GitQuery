package gitquery.backend.services;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import gitquery.backend.entity.User;
import gitquery.backend.exceptions.QuotaExceededException;
import gitquery.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;

/**
 * Per-user model spend accounting and enforcement.
 *
 * <p>Usage is stored as raw token counts and converted to currency here, so the
 * rates can change without invalidating stored data. All three figures are
 * configurable, defaulting to Claude Haiku 5.5 list pricing.
 *
 * <p>Enforcement is a check before generation. Because the cost of a reply is
 * only known once it finishes, a request that starts just under the limit can
 * overshoot by one answer — bounded in practice at well under a cent. Making
 * that exact would need to reserve budget up front and reconcile afterwards.
 */
@Service
@Slf4j
public class UsageService {

    private static final double TOKENS_PER_UNIT = 1_000_000d;

    private final UserRepository userRepository;
    private final double includedCreditUsd;
    private final double inputUsdPerMillion;
    private final double outputUsdPerMillion;

    public UsageService(
            UserRepository userRepository,
            @Value("${app.usage.included-credit-usd:0.05}") double includedCreditUsd,
            @Value("${app.usage.input-usd-per-million:0.10}") double inputUsdPerMillion,
            @Value("${app.usage.output-usd-per-million:0.50}") double outputUsdPerMillion) {
        this.userRepository = userRepository;
        this.includedCreditUsd = includedCreditUsd;
        this.inputUsdPerMillion = inputUsdPerMillion;
        this.outputUsdPerMillion = outputUsdPerMillion;
    }

    public double costOf(long inputTokens, long outputTokens) {
        return (inputTokens / TOKENS_PER_UNIT) * inputUsdPerMillion
                + (outputTokens / TOKENS_PER_UNIT) * outputUsdPerMillion;
    }

    public double usedUsd(User user) {
        return costOf(user.getInputTokens(), user.getOutputTokens());
    }

    public double remainingUsd(User user) {
        return Math.max(0d, includedCreditUsd - usedUsd(user));
    }

    public double includedCreditUsd() {
        return includedCreditUsd;
    }

    public boolean hasRemaining(User user) {
        return usedUsd(user) < includedCreditUsd;
    }

    /** @throws QuotaExceededException when the user has nothing left. */
    public void requireRemaining(User user) {
        if (!hasRemaining(user)) {
            log.info(
                    "Blocked chat for user {} at ${} of ${} used",
                    user.getId(),
                    String.format("%.5f", usedUsd(user)),
                    includedCreditUsd);
            throw new QuotaExceededException(
                    "Your included allowance of $"
                            + String.format("%.2f", includedCreditUsd)
                            + " has been used. Contact " + CONTACT_EMAIL
                            + " to request more credits.");
        }
    }

    /**
     * Adds usage. Called after a reply completes, when the token counts are
     * finally known. Failures are logged rather than propagated: the reply has
     * already been delivered, and losing an accounting record is preferable to
     * failing the request at that point.
     */
    @Transactional
    public void record(UUID userId, Integer inputTokens, Integer outputTokens) {
        long in = inputTokens == null ? 0L : inputTokens;
        long out = outputTokens == null ? 0L : outputTokens;
        if (in <= 0 && out <= 0) {
            log.debug("No token usage reported for user {}; nothing recorded", userId);
            return;
        }
        try {
            int updated = userRepository.addTokenUsage(userId, in, out);
            if (updated == 0) {
                log.warn("Usage recorded for unknown user {}", userId);
            } else {
                log.debug("Recorded {} in / {} out tokens for user {}", in, out, userId);
            }
        } catch (Exception ex) {
            log.error("Could not record token usage for user {}", userId, ex);
        }
    }

    /** Where users ask for a larger allowance. Mirrored in the frontend. */
    public static final String CONTACT_EMAIL = "work.aditya404@gmail.com";
}
