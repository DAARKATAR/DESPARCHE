using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using CodZombies.Enemies;

namespace CodZombies.Managers
{
    public class RoundManager : MonoBehaviour
    {
        public static RoundManager Instance { get; private set; }

        [Header("Round State")]
        public int currentRound = 1;
        public int zombiesRemainingToSpawn = 0;
        public int zombiesAlive = 0;
        public bool isIntermission = false;
        public bool isHellhoundRound = false;

        [Header("Spawn Settings")]
        public GameObject zombiePrefab;
        public GameObject hellhoundPrefab;
        public List<Transform> spawnPoints = new List<Transform>();
        public float spawnDelay = 2.0f;
        public int maxActiveZombies = 24;

        public event Action<int> OnRoundStarted;
        public event Action OnRoundEnded;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            StartRound(currentRound);
        }

        public void StartRound(int round)
        {
            currentRound = round;
            isIntermission = false;
            isHellhoundRound = (currentRound % 5 == 0 && currentRound > 4);

            // COD classic zombie count formula
            zombiesRemainingToSpawn = Mathf.RoundToInt(currentRound * 3.5f + 6);
            zombiesAlive = 0;

            OnRoundStarted?.Invoke(currentRound);
            StartCoroutine(SpawnLoop());
        }

        private IEnumerator SpawnLoop()
        {
            while (zombiesRemainingToSpawn > 0)
            {
                if (zombiesAlive < maxActiveZombies && spawnPoints.Count > 0)
                {
                    Transform chosenPoint = spawnPoints[UnityEngine.Random.Range(0, spawnPoints.Count)];
                    GameObject prefab = isHellhoundRound ? hellhoundPrefab : zombiePrefab;

                    GameObject zObj = Instantiate(prefab, chosenPoint.position, Quaternion.identity);
                    var zAI = zObj.GetComponent<ZombieAI>();
                    if (zAI != null)
                    {
                        // Calculate health scaling
                        float health = 150f;
                        if (currentRound < 10) health += (currentRound - 1) * 100f;
                        else health = 950f * Mathf.Pow(1.1f, currentRound - 9);

                        zAI.maxHealth = health;
                        zAI.currentHealth = health;
                        zAI.moveSpeed = Mathf.Min(6.5f, 2.5f + currentRound * 0.25f);
                    }

                    zombiesRemainingToSpawn--;
                    zombiesAlive++;
                }

                yield return new WaitForSeconds(spawnDelay);
            }

            // Wait until all spawned zombies are eliminated
            while (FindObjectsByType<ZombieAI>(FindObjectsSortMode.None).Length > 0)
            {
                yield return new WaitForSeconds(1.0f);
            }

            // Round Complete!
            OnRoundEnded?.Invoke();
            isIntermission = true;
            yield return new WaitForSeconds(8.0f); // 8-second intermission
            StartRound(currentRound + 1);
        }
    }
}
