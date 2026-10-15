package gitquery.backend.exceptions;

/** Thrown when a user has spent their included model allowance. */
public class QuotaExceededException extends RuntimeException {
    public QuotaExceededException(String message) {
        super(message);
    }
}
