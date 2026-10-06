using UnityEngine;
using UnityEngine.UI;
using CodZombies.Player;

namespace CodZombies.UI
{
    public class DoomPortraitController : MonoBehaviour
    {
        [Header("Target References")]
        public PlayerStats playerStats;
        public PlayerController2D playerController;
        public Image portraitImage;
        public Image hitFlashOverlay;
        public Image sacredHaloOverlay;
        public Image cursedHornsOverlay;

        [Header("DOOM Health Tier Sprites (Normal Survivor)")]
        public Sprite tier1_Healthy;    // 80 - 100%
        public Sprite tier2_LightHurt;  // 60 - 79%
        public Sprite tier3_Bloody;     // 40 - 59%
        public Sprite tier4_Battered;   // 20 - 39%
        public Sprite tier5_Critical;   // 1 - 19%
        public Sprite tier0_Downed;     // 0% Dead

        [Header("Hit Reaction (DOOM Ouch Face)")]
        public Sprite ouchFaceSprite;

        private void Update()
        {
            if (playerStats == null || portraitImage == null) return;

            float healthPercent = (playerStats.currentHealth / playerStats.maxHealth) * 100f;
            bool isTakingDamage = Time.time - playerStats.LastDamageTime < 0.32f;

            // 1. Hit Flash
            if (hitFlashOverlay != null)
            {
                hitFlashOverlay.gameObject.SetActive(isTakingDamage);
            }

            // 2. Select DOOM Face Sprite
            if (playerStats.IsDead)
            {
                if (tier0_Downed != null) portraitImage.sprite = tier0_Downed;
            }
            else if (isTakingDamage && ouchFaceSprite != null)
            {
                portraitImage.sprite = ouchFaceSprite;
            }
            else
            {
                if (healthPercent >= 80f && tier1_Healthy != null) portraitImage.sprite = tier1_Healthy;
                else if (healthPercent >= 60f && tier2_LightHurt != null) portraitImage.sprite = tier2_LightHurt;
                else if (healthPercent >= 40f && tier3_Bloody != null) portraitImage.sprite = tier3_Bloody;
                else if (healthPercent >= 20f && tier4_Battered != null) portraitImage.sprite = tier4_Battered;
                else if (tier5_Critical != null) portraitImage.sprite = tier5_Critical;
            }

            // 3. Alignment Visual Overlays (Sagrado vs Maldito)
            if (sacredHaloOverlay != null)
            {
                sacredHaloOverlay.gameObject.SetActive(playerStats.alignment == AltarAlignment.Sacred);
            }

            if (cursedHornsOverlay != null)
            {
                cursedHornsOverlay.gameObject.SetActive(playerStats.alignment == AltarAlignment.Cursed);
            }
        }
    }
}
