using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using CodZombies.Player;
using CodZombies.Weapons;

namespace CodZombies.World
{
    public class MysteryBox : MonoBehaviour
    {
        [Header("Settings")]
        public int boxCost = 950;
        public float rollDuration = 3.5f;
        public List<WeaponData> availableWeapons = new List<WeaponData>();

        [Header("State")]
        public bool isRolling = false;
        public WeaponData rolledWeapon = null;

        public bool TryOpenBox(PlayerStats player, WeaponManager weaponManager)
        {
            if (isRolling || availableWeapons.Count == 0) return false;

            if (player.SpendPoints(boxCost))
            {
                StartCoroutine(RollRoutine(weaponManager));
                return true;
            }

            return false;
        }

        private IEnumerator RollRoutine(WeaponManager weaponManager)
        {
            isRolling = true;
            rolledWeapon = null;

            yield return new WaitForSeconds(rollDuration);

            // 1 in 8 chance of teddy bear
            if (Random.value < 0.12f)
            {
                // Teddy Bear relocation
                rolledWeapon = null;
            }
            else
            {
                rolledWeapon = availableWeapons[Random.Range(0, availableWeapons.Count)];
                // Auto equip or wait for player [F]
                weaponManager.EquipWeapon(rolledWeapon);
            }

            isRolling = false;
        }
    }
}
