using System;
using UnityEngine;

namespace CodZombies.Player
{
    public enum AltarAlignment
    {
        Neutral,
        Sacred,
        Cursed
    }

    public class PlayerStats : MonoBehaviour
    {
        [Header("Health Settings")]
        public float maxHealth = 100f;
        public float currentHealth = 100f;
        public float healthRegenSpeed = 40f;
        public float healthRegenDelay = 4f;

        [Header("Stamina Settings")]
        public float maxStamina = 100f;
        public float currentStamina = 100f;
        public float staminaDrainRate = 25f;
        public float staminaRecoveryRate = 20f;

        [Header("Economy & Stats")]
        public int points = 500;
        public int kills = 0;
        public int headshots = 0;
        public int downs = 0;

        [Header("Ritual Alignment (Disco Elysium Morphs)")]
        public AltarAlignment alignment = AltarAlignment.Neutral;

        [Header("Perks")]
        public bool hasJuggernog = false;
        public bool hasSpeedCola = false;
        public bool hasDoubleTap = false;
        public bool hasQuickRevive = false;
        public bool hasStaminUp = false;

        public float LastDamageTime { get; private set; } = -10f;
        public bool IsDead => currentHealth <= 0f;

        public event Action<float, float> OnHealthChanged;
        public event Action<int> OnPointsChanged;
        public event Action OnPlayerDamaged;
        public event Action OnPlayerDowned;

        private void Start()
        {
            currentHealth = maxHealth;
            currentStamina = maxStamina;
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
            OnPointsChanged?.Invoke(points);
        }

        private void Update()
        {
            if (IsDead) return;

            // Health regeneration
            float delay = hasQuickRevive ? 2.5f : healthRegenDelay;
            if (alignment == AltarAlignment.Cursed) delay += 2.0f; // Cursed Blood Covenant trade-off

            if (Time.time - LastDamageTime > delay && currentHealth < maxHealth)
            {
                float speed = hasQuickRevive ? healthRegenSpeed * 1.5f : healthRegenSpeed;
                currentHealth = Mathf.Min(maxHealth, currentHealth + speed * Time.deltaTime);
                OnHealthChanged?.Invoke(currentHealth, maxHealth);
            }
        }

        public void TakeDamage(float amount)
        {
            if (IsDead) return;

            currentHealth -= amount;
            LastDamageTime = Time.time;
            OnPlayerDamaged?.Invoke();

            if (currentHealth <= 0f)
            {
                currentHealth = 0f;
                downs++;
                OnPlayerDowned?.Invoke();
            }

            OnHealthChanged?.Invoke(currentHealth, maxHealth);
        }

        public void Heal(float amount)
        {
            if (IsDead) return;
            currentHealth = Mathf.Min(maxHealth, currentHealth + amount);
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
        }

        public void AddPoints(int amount)
        {
            points += amount;
            OnPointsChanged?.Invoke(points);
        }

        public bool SpendPoints(int cost)
        {
            if (points >= cost)
            {
                points -= cost;
                OnPointsChanged?.Invoke(points);
                return true;
            }
            return false;
        }

        public void ApplyPerk(string perkId)
        {
            switch (perkId.ToLower())
            {
                case "juggernog":
                    hasJuggernog = true;
                    maxHealth = 250f;
                    currentHealth = 250f;
                    break;
                case "speed_cola":
                    hasSpeedCola = true;
                    break;
                case "double_tap":
                    hasDoubleTap = true;
                    break;
                case "quick_revive":
                    hasQuickRevive = true;
                    break;
                case "stamin_up":
                    hasStaminUp = true;
                    maxStamina = 150f;
                    break;
            }
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
        }
    }
}
