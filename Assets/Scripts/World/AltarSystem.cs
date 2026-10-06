using System.Collections;
using UnityEngine;
using CodZombies.Player;
using CodZombies.Weapons;

namespace CodZombies.World
{
    public class AltarSystem : MonoBehaviour
    {
        [Header("Altar Settings")]
        public AltarAlignment altarType = AltarAlignment.Sacred;
        public int upgradeCost = 5000;
        public float ritualDuration = 4.0f;

        [Header("Visual Effects")]
        public ParticleSystem ritualParticles;
        public Light altarLight;

        public bool IsRitualActive { get; private set; }

        public bool TryInitiateRitual(WeaponManager weaponManager, PlayerStats player)
        {
            if (IsRitualActive) return false;

            var currentWeapon = weaponManager.CurrentWeapon;
            if (currentWeapon == null || currentWeapon.data.isPackAPunched) return false;

            if (player.SpendPoints(upgradeCost))
            {
                StartCoroutine(RitualSequence(weaponManager, player));
                return true;
            }

            return false;
        }

        private IEnumerator RitualSequence(WeaponManager weaponManager, PlayerStats player)
        {
            IsRitualActive = true;
            if (ritualParticles != null) ritualParticles.Play();

            yield return new WaitForSeconds(ritualDuration);

            var weapon = weaponManager.CurrentWeapon;
            if (weapon != null)
            {
                // Create an upgraded runtime copy of the weapon data
                var upgradedData = ScriptableObject.Instantiate(weapon.data);
                upgradedData.isPackAPunched = true;
                upgradedData.weaponName = (altarType == AltarAlignment.Sacred ? "[SAGRADO] " : "[MALDITO] ") + weapon.data.papName;
                upgradedData.altarAffinity = altarType;

                if (altarType == AltarAlignment.Sacred)
                {
                    upgradedData.damage *= 1.4f;
                    upgradedData.lifestealPerHit = 4.0f; // Heals 4 HP on hit
                    upgradedData.bulletColor = new Color(0.2f, 0.8f, 1f); // Celestial Cyan / Gold
                }
                else // Cursed
                {
                    upgradedData.damage *= 2.2f; // Devastating infernal damage
                    upgradedData.causesInfernalBurn = true;
                    upgradedData.bulletColor = new Color(1f, 0.15f, 0.15f); // Demonic Hellfire
                }

                weapon.data = upgradedData;
                weapon.currentMag = upgradedData.magazineSize;
                weapon.reserveAmmo = upgradedData.maxReserveAmmo;

                // Update Player Alignment (Morphs the DOOM / Disco Elysium Face!)
                player.alignment = altarType;
            }

            if (ritualParticles != null) ritualParticles.Stop();
            IsRitualActive = false;
        }
    }
}
