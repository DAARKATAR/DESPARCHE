using System.Collections;
using UnityEngine;
using CodZombies.Player;
using CodZombies.Weapons;
using CodZombies.Enemies;

namespace CodZombies.World
{
    public enum PowerUpType
    {
        MaxAmmo,
        InstaKill,
        DoublePoints,
        Nuke,
        Carpenter
    }

    public class PowerUpManager : MonoBehaviour
    {
        public static PowerUpManager Instance { get; private set; }

        public GameObject powerUpDropPrefab;

        private bool isInstaKillActive = false;
        private bool isDoublePointsActive = false;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void SpawnRandomPowerUp(Vector2 position)
        {
            if (powerUpDropPrefab == null) return;
            PowerUpType randomType = (PowerUpType)Random.Range(0, 5);
            GameObject obj = Instantiate(powerUpDropPrefab, position, Quaternion.identity);
            var drop = obj.GetComponent<PowerUpDrop>();
            if (drop != null) drop.Initialize(randomType);
        }

        public void ActivatePowerUp(PowerUpType type, PlayerStats player, WeaponManager weapons)
        {
            switch (type)
            {
                case PowerUpType.MaxAmmo:
                    weapons.RefillMaxAmmo();
                    break;
                case PowerUpType.Nuke:
                    // Wipe all zombies currently alive and grant 400 pts
                    var zombies = FindObjectsOfType<ZombieAI>();
                    foreach (var z in zombies) z.TakeDamage(99999f, false, false);
                    player.AddPoints(400);
                    break;
                case PowerUpType.Carpenter:
                    // Repair all barricades
                    var barricades = FindObjectsOfType<Barricade>();
                    foreach (var b in barricades)
                    {
                        while (b.TryRepairPlank(player)) { }
                    }
                    player.AddPoints(200);
                    break;
                case PowerUpType.InstaKill:
                    StartCoroutine(InstaKillRoutine(30f));
                    break;
                case PowerUpType.DoublePoints:
                    StartCoroutine(DoublePointsRoutine(30f));
                    break;
            }
        }

        private IEnumerator InstaKillRoutine(float duration)
        {
            isInstaKillActive = true;
            yield return new WaitForSeconds(duration);
            isInstaKillActive = false;
        }

        private IEnumerator DoublePointsRoutine(float duration)
        {
            isDoublePointsActive = true;
            yield return new WaitForSeconds(duration);
            isDoublePointsActive = false;
        }
    }

    public class PowerUpDrop : MonoBehaviour
    {
        public PowerUpType powerUpType;

        public void Initialize(PowerUpType type)
        {
            powerUpType = type;
            Destroy(gameObject, 30f); // 30-second despawn
        }

        private void OnTriggerEnter2D(Collider2D collision)
        {
            if (collision.CompareTag("Player"))
            {
                var player = collision.GetComponent<PlayerStats>();
                var weapons = collision.GetComponent<WeaponManager>();
                if (player != null && weapons != null)
                {
                    PowerUpManager.Instance?.ActivatePowerUp(powerUpType, player, weapons);
                    Destroy(gameObject);
                }
            }
        }
    }
}
