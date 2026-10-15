package gitquery.backend.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import gitquery.backend.entity.User;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByGithubId(Long githubId);

    /**
     * Increments usage in the database rather than reading, adding and saving in
     * Java, so two concurrent requests cannot both write back the same total and
     * lose one another's tokens.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update User u
               set u.inputTokens = u.inputTokens + :inputTokens,
                   u.outputTokens = u.outputTokens + :outputTokens
             where u.id = :userId
            """)
    int addTokenUsage(
            @Param("userId") UUID userId,
            @Param("inputTokens") long inputTokens,
            @Param("outputTokens") long outputTokens);
}
