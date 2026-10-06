using UnityEngine;
using UnityEngine.UI;
using CodZombies.Player;
using CodZombies.Weapons;
using CodZombies.Managers;

namespace CodZombies.UI
{
    public class GameHUD : MonoBehaviour
    {
        [Header("References")]
        public PlayerStats playerStats;
        public WeaponManager weaponManager;

        [Header("UI Text Displays")]
        public Text roundText;
        public Text pointsText;
        public Text ammoText;
        public Text weaponNameText;
        public Text promptText;

        [Header("Bars")]
        public Slider healthBar;
        public Slider staminaBar;

        private void Start()
        {
            if (RoundManager.Instance != null)
            {
                RoundManager.Instance.OnRoundStarted += UpdateRoundText;
            }
        }

        private void OnDestroy()
        {
            if (RoundManager.Instance != null)
            {
                RoundManager.Instance.OnRoundStarted -= UpdateRoundText;
            }
        }

        private void Update()
        {
            if (playerStats == null) return;

            // 1. Points
            if (pointsText != null)
            {
                pointsText.text = playerStats.points.ToString();
            }

            // 2. Health & Stamina Bars
            if (healthBar != null)
            {
                healthBar.maxValue = playerStats.maxHealth;
                healthBar.value = playerStats.currentHealth;
            }

            if (staminaBar != null)
            {
                staminaBar.maxValue = playerStats.maxStamina;
                staminaBar.value = playerStats.currentStamina;
            }

            // 3. Ammo & Weapon Info
            if (weaponManager != null && weaponManager.CurrentWeapon != null)
            {
                var w = weaponManager.CurrentWeapon;
                if (weaponNameText != null)
                {
                    weaponNameText.text = w.data.weaponName;
                }

                if (ammoText != null)
                {
                    ammoText.text = $"{w.currentMag} / {w.reserveAmmo}";
                }
            }
        }

        private void UpdateRoundText(int round)
        {
            if (roundText == null) return;

            if (round <= 5)
            {
                string tally = "";
                for (int i = 0; i < round; i++) tally += "I";
                roundText.text = round == 5 ? "V" : tally;
            }
            else
            {
                roundText.text = round.ToString();
            }
        }

        public void SetPrompt(string message)
        {
            if (promptText != null)
            {
                promptText.text = message;
                promptText.gameObject.SetActive(!string.IsNullOrEmpty(message));
            }
        }
    }
}
