using System.Collections;
using UnityEngine;
using CodZombies.Player;
using CodZombies.World;

namespace CodZombies.Enemies
{
    public enum ZombieState
    {
        Spawning,
        Chasing,
        AttackingBarricade,
        AttackingPlayer,
        Dead
    }

    [RequireComponent(typeof(Rigidbody2D))]
    public class ZombieAI : MonoBehaviour
    {
        [Header("Stats")]
        public float maxHealth = 150f;
        public float currentHealth = 150f;
        public float moveSpeed = 3.2f;
        public float attackDamage = 50f;
        public float attackRange = 1.2f;
        public float attackCooldown = 1.2f;
        public bool isHellhound = false;

        [Header("Targets")]
        public Transform playerTarget;
        public Barricade currentBarricade;

        private Rigidbody2D rb;
        private ZombieState state = ZombieState.Chasing;
        private float lastAttackTime = -10f;
        private bool isDead = false;

        public ZombieState CurrentState => state;

        private void Awake()
        {
            rb = GetComponent<Rigidbody2D>();
        }

        private void Start()
        {
            currentHealth = maxHealth;
            if (playerTarget == null)
            {
                var p = FindAnyObjectByType<PlayerStats>();
                if (p != null) playerTarget = p.transform;
            }
        }

        private void Update()
        {
            if (isDead || playerTarget == null) return;

            float distToPlayer = Vector2.Distance(transform.position, playerTarget.position);

            // 1. If currently blocked by a barricade window with planks
            if (currentBarricade != null && currentBarricade.HasPlanks)
            {
                state = ZombieState.AttackingBarricade;
                if (Time.time - lastAttackTime > attackCooldown)
                {
                    lastAttackTime = Time.time;
                    currentBarricade.DamagePlank();
                }
                return;
            }

            // 2. Chasing Player vs Attacking Player
            if (distToPlayer <= attackRange)
            {
                state = ZombieState.AttackingPlayer;
                rb.velocity = Vector2.zero;

                if (Time.time - lastAttackTime > attackCooldown)
                {
                    lastAttackTime = Time.time;
                    var playerStats = playerTarget.GetComponent<PlayerStats>();
                    if (playerStats != null)
                    {
                        playerStats.TakeDamage(attackDamage);
                    }
                }
            }
            else
            {
                state = ZombieState.Chasing;
                Vector2 dir = ((Vector2)playerTarget.position - rb.position).normalized;
                rb.velocity = dir * moveSpeed;

                // Rotate towards player
                float angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;
                rb.rotation = angle;
            }
        }

        public void TakeDamage(float amount, bool isHeadshot, bool isKnife)
        {
            if (isDead) return;

            if (World.PowerUpManager.Instance != null && World.PowerUpManager.Instance.IsInstaKillActive)
            {
                amount = 99999f;
            }

            float finalDamage = isHeadshot ? amount * 2.5f : amount;
            currentHealth -= finalDamage;

            if (currentHealth <= 0f)
            {
                Die(isHeadshot, isKnife);
            }
        }

        public void ApplyBurn(float totalDamage, float duration)
        {
            if (isDead) return;
            StartCoroutine(BurnRoutine(totalDamage, duration));
        }

        private IEnumerator BurnRoutine(float totalDamage, float duration)
        {
            float elapsed = 0f;
            float tickRate = 0.5f;
            float damagePerTick = totalDamage / (duration / tickRate);

            while (elapsed < duration && !isDead)
            {
                yield return new WaitForSeconds(tickRate);
                elapsed += tickRate;
                TakeDamage(damagePerTick, false, false);
            }
        }

        private void Die(bool isHeadshot, bool isKnife)
        {
            isDead = true;
            state = ZombieState.Dead;
            rb.velocity = Vector2.zero;

            // Notify round manager and player rewards
            var playerStats = playerTarget?.GetComponent<PlayerStats>();
            if (playerStats != null)
            {
                playerStats.kills++;
                if (isHeadshot)
                {
                    playerStats.headshots++;
                    playerStats.AddPoints(100); // 100 bonus for headshot
                }
                else if (isKnife)
                {
                    playerStats.AddPoints(130);
                }
                else
                {
                    playerStats.AddPoints(60); // 60 body kill
                }
            }

            // Power-up drop roll (approx 3% chance)
            if (Random.value < 0.035f)
            {
                World.PowerUpManager.Instance?.SpawnRandomPowerUp(transform.position);
            }

            Destroy(gameObject, 0.4f);
        }

        private void OnTriggerEnter2D(Collider2D collision)
        {
            if (collision.TryGetComponent<Barricade>(out var bar))
            {
                if (bar.HasPlanks)
                {
                    currentBarricade = bar;
                }
            }
        }
    }
}
