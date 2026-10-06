using UnityEngine;

namespace CodZombies.Weapons
{
    public enum WeaponType
    {
        Pistol,
        Shotgun,
        SMG,
        Rifle,
        LMG,
        WonderWeapon
    }

    [CreateAssetMenu(fileName = "NewWeaponData", menuName = "CodZombies/Weapon Data")]
    public class WeaponData : ScriptableObject
    {
        [Header("Identity")]
        public string weaponId = "m1911";
        public string weaponName = "M1911";
        public string papName = "Mustang & Sally";
        public WeaponType weaponType = WeaponType.Pistol;

        [Header("Damage & Ballistics")]
        public float damage = 25f;
        public float fireRate = 5f; // Rounds per second
        public float bulletSpeed = 22f;
        public float spreadAngle = 2f;
        public int pellets = 1; // 8 for shotguns
        public int penetration = 1;
        public bool isAutomatic = false;

        [Header("Ammunition")]
        public int magazineSize = 8;
        public int maxReserveAmmo = 32;
        public float reloadTime = 1.4f;

        [Header("Explosive")]
        public bool isExplosive = false;
        public float explosionRadius = 3f;
        public float explosionDamage = 150f;

        [Header("Altar Consecration")]
        public bool isPackAPunched = false;
        public Player.AltarAlignment altarAffinity = Player.AltarAlignment.Neutral;
        public float lifestealPerHit = 0f; // Sacred buff: heals player
        public bool causesInfernalBurn = false; // Cursed buff: burn damage over time

        [Header("Visuals & Audio")]
        public Color bulletColor = Color.yellow;
        public AudioClip shootSound;
        public AudioClip reloadSound;
    }
}
