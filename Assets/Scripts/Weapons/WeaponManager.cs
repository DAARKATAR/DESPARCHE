using System;
using System.Collections.Generic;
using UnityEngine;
using CodZombies.Player;

namespace CodZombies.Weapons
{
    [System.Serializable]
    public class RuntimeWeapon
    {
        public WeaponData data;
        public int currentMag;
        public int reserveAmmo;
        public bool isReloading;
        public float reloadTimer;

        public RuntimeWeapon(WeaponData data)
        {
            this.data = data;
            this.currentMag = data.magazineSize;
            this.reserveAmmo = data.maxReserveAmmo;
            this.isReloading = false;
            this.reloadTimer = 0f;
        }
    }

    public class WeaponManager : MonoBehaviour
    {
        [Header("Starting Loadout")]
        public WeaponData startingPistol;
        public Transform firePoint;
        public GameObject bulletPrefab;

        [Header("Inventory")]
        public List<RuntimeWeapon> weapons = new List<RuntimeWeapon>();
        public int currentWeaponIndex = 0;

        private PlayerStats stats;
        private float lastFireTime = 0f;

        public RuntimeWeapon CurrentWeapon => weapons.Count > 0 ? weapons[currentWeaponIndex] : null;

        public event Action OnWeaponFired;
        public event Action OnAmmoChanged;
        public event Action OnWeaponSwapped;

        private void Awake()
        {
            stats = GetComponent<PlayerStats>();
        }

        private void Start()
        {
            if (startingPistol != null)
            {
                EquipWeapon(startingPistol);
            }
        }

        private void Update()
        {
            if (stats.IsDead || CurrentWeapon == null) return;

            // 1. Reload timer handling
            if (CurrentWeapon.isReloading)
            {
                CurrentWeapon.reloadTimer -= Time.deltaTime;
                if (CurrentWeapon.reloadTimer <= 0f)
                {
                    CompleteReload();
                }
            }

            // 2. Weapon Swap (Q, 1, 2, or Mouse Scroll)
            if (Input.GetKeyDown(KeyCode.Q) && weapons.Count > 1)
            {
                SwapWeapon((currentWeaponIndex + 1) % weapons.Count);
            }

            // 3. Manual Reload (R)
            if (Input.GetKeyDown(KeyCode.R) && !CurrentWeapon.isReloading)
            {
                StartReload();
            }

            // 4. Shooting (Left Mouse Button)
            bool shootInput = CurrentWeapon.data.isAutomatic ? Input.GetMouseButton(0) : Input.GetMouseButtonDown(0);
            if (shootInput && !CurrentWeapon.isReloading)
            {
                float effectiveFireRate = stats.hasDoubleTap ? CurrentWeapon.data.fireRate * 1.35f : CurrentWeapon.data.fireRate;
                if (Time.time - lastFireTime >= 1f / effectiveFireRate)
                {
                    TryFire();
                }
            }
        }

        public void EquipWeapon(WeaponData newWeapon)
        {
            if (weapons.Count < 2)
            {
                weapons.Add(new RuntimeWeapon(newWeapon));
                currentWeaponIndex = weapons.Count - 1;
            }
            else
            {
                weapons[currentWeaponIndex] = new RuntimeWeapon(newWeapon);
            }
            OnWeaponSwapped?.Invoke();
            OnAmmoChanged?.Invoke();
        }

        public void SwapWeapon(int index)
        {
            if (index >= 0 && index < weapons.Count)
            {
                if (CurrentWeapon != null && CurrentWeapon.isReloading)
                {
                    CurrentWeapon.isReloading = false; // Cancel reload on swap
                }
                currentWeaponIndex = index;
                OnWeaponSwapped?.Invoke();
                OnAmmoChanged?.Invoke();
            }
        }

        private void TryFire()
        {
            if (CurrentWeapon.currentMag <= 0)
            {
                StartReload();
                return;
            }

            CurrentWeapon.currentMag--;
            lastFireTime = Time.time;

            // Spawn Pellets (1 for pistols/rifles, multiple for shotguns)
            int count = CurrentWeapon.data.pellets > 1 ? CurrentWeapon.data.pellets : 1;
            for (int i = 0; i < count; i++)
            {
                float spread = UnityEngine.Random.Range(-CurrentWeapon.data.spreadAngle, CurrentWeapon.data.spreadAngle);
                Quaternion rot = firePoint.rotation * Quaternion.Euler(0f, 0f, spread);

                GameObject bObj = Instantiate(bulletPrefab, firePoint.position, rot);
                var b = bObj.GetComponent<Bullet2D>();
                if (b != null)
                {
                    Vector2 dir = rot * Vector2.right;
                    b.Initialize(CurrentWeapon.data, stats, dir * CurrentWeapon.data.bulletSpeed);
                }
            }

            OnWeaponFired?.Invoke();
            OnAmmoChanged?.Invoke();
        }

        private void StartReload()
        {
            if (CurrentWeapon.currentMag >= CurrentWeapon.data.magazineSize || CurrentWeapon.reserveAmmo <= 0) return;

            CurrentWeapon.isReloading = true;
            float duration = stats.hasSpeedCola ? CurrentWeapon.data.reloadTime * 0.5f : CurrentWeapon.data.reloadTime;
            CurrentWeapon.reloadTimer = duration;
        }

        private void CompleteReload()
        {
            CurrentWeapon.isReloading = false;
            int needed = CurrentWeapon.data.magazineSize - CurrentWeapon.currentMag;
            int available = Mathf.Min(needed, CurrentWeapon.reserveAmmo);
            CurrentWeapon.currentMag += available;
            CurrentWeapon.reserveAmmo -= available;
            OnAmmoChanged?.Invoke();
        }

        public void RefillMaxAmmo()
        {
            foreach (var w in weapons)
            {
                w.reserveAmmo = w.data.maxReserveAmmo;
            }
            OnAmmoChanged?.Invoke();
        }
    }
}
