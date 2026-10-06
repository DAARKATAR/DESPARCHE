using UnityEngine;

namespace CodZombies.Player
{
    [RequireComponent(typeof(Rigidbody2D), typeof(PlayerStats))]
    public class PlayerController2D : MonoBehaviour
    {
        [Header("Movement Speeds")]
        public float walkSpeed = 5.5f;
        public float sprintSpeed = 8.5f;

        [Header("Melee Settings")]
        public float knifeRange = 1.6f;
        public float knifeDamage = 150f;
        public float knifeCooldown = 0.6f;
        public LayerMask zombieLayer;

        [Header("References")]
        public Camera mainCamera;
        public Transform firePoint;

        private Rigidbody2D rb;
        private PlayerStats stats;
        private Vector2 moveInput;
        private Vector2 mouseWorldPos;
        private float lastKnifeTime = -1f;

        public float AimAngle { get; private set; }
        public bool IsSprinting { get; private set; }
        public bool IsKnifing { get; private set; }

        private void Awake()
        {
            rb = GetComponent<Rigidbody2D>();
            stats = GetComponent<PlayerStats>();
            if (mainCamera == null) mainCamera = Camera.main;
        }

        private void Update()
        {
            if (stats.IsDead)
            {
                moveInput = Vector2.zero;
                return;
            }

            // 1. Movement Inputs (WASD / Arrows)
            moveInput.x = Input.GetAxisRaw("Horizontal");
            moveInput.y = Input.GetAxisRaw("Vertical");
            moveInput = moveInput.normalized;

            // 2. Sprint Logic (Left Shift)
            bool wantsSprint = Input.GetKey(KeyCode.LeftShift) && moveInput.magnitude > 0.1f;
            if (wantsSprint && stats.currentStamina > 0f)
            {
                IsSprinting = true;
                stats.currentStamina = Mathf.Max(0f, stats.currentStamina - stats.staminaDrainRate * Time.deltaTime);
            }
            else
            {
                IsSprinting = false;
                if (!wantsSprint && stats.currentStamina < stats.maxStamina)
                {
                    float recovery = stats.hasStaminUp ? stats.staminaRecoveryRate * 1.5f : stats.staminaRecoveryRate;
                    stats.currentStamina = Mathf.Min(stats.maxStamina, stats.currentStamina + recovery * Time.deltaTime);
                }
            }

            // 3. Aim Direction (Mouse Look)
            if (mainCamera != null)
            {
                mouseWorldPos = mainCamera.ScreenToWorldPoint(Input.mousePosition);
                Vector2 lookDir = mouseWorldPos - rb.position;
                AimAngle = Mathf.Atan2(lookDir.y, lookDir.x) * Mathf.Rad2Deg;
                rb.rotation = AimAngle;
            }

            // 4. Knife Melee Attack (E or Space)
            if ((Input.GetKeyDown(KeyCode.E) || Input.GetKeyDown(KeyCode.Space)) && Time.time - lastKnifeTime > knifeCooldown)
            {
                PerformKnifeAttack();
            }

            if (Time.time - lastKnifeTime > 0.35f)
            {
                IsKnifing = false;
            }
        }

        private void FixedUpdate()
        {
            float speed = IsSprinting ? (stats.hasStaminUp ? sprintSpeed * 1.15f : sprintSpeed) : walkSpeed;
            rb.velocity = moveInput * speed;
        }

        private void PerformKnifeAttack()
        {
            lastKnifeTime = Time.time;
            IsKnifing = true;

            // Raycast / CircleCast in front of player
            Vector2 forwardDir = transform.right;
            RaycastHit2D hit = Physics2D.CircleCast(transform.position, 0.6f, forwardDir, knifeRange, zombieLayer);
            if (hit.collider != null)
            {
                var zombie = hit.collider.GetComponent<Enemies.ZombieAI>();
                if (zombie != null)
                {
                    zombie.TakeDamage(knifeDamage, false, true);
                    stats.AddPoints(130); // Knife kill reward
                }
            }
        }
    }
}
