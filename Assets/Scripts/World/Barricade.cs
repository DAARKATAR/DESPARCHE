using UnityEngine;
using CodZombies.Player;

namespace CodZombies.World
{
    public class Barricade : MonoBehaviour
    {
        [Header("Planks")]
        public int maxPlanks = 6;
        public int currentPlanks = 6;
        public float repairHoldTime = 0.5f;

        [Header("Visual Planks")]
        public GameObject[] plankVisuals;

        public bool HasPlanks => currentPlanks > 0;
        public bool IsFullyRepaired => currentPlanks >= maxPlanks;

        private void Start()
        {
            UpdatePlankVisuals();
        }

        public void DamagePlank()
        {
            if (currentPlanks > 0)
            {
                currentPlanks--;
                UpdatePlankVisuals();
            }
        }

        public bool TryRepairPlank(PlayerStats player)
        {
            if (currentPlanks < maxPlanks)
            {
                currentPlanks++;
                player.AddPoints(10); // +10 points per plank
                UpdatePlankVisuals();
                return true;
            }
            return false;
        }

        private void UpdatePlankVisuals()
        {
            if (plankVisuals == null) return;
            for (int i = 0; i < plankVisuals.Length; i++)
            {
                if (plankVisuals[i] != null)
                {
                    plankVisuals[i].SetActive(i < currentPlanks);
                }
            }
        }
    }
}
