using UnityEngine;
using CodZombies.Enemies;
using CodZombies.Player;

namespace CodZombies.Weapons
{
    [RequireComponent(typeof(Rigidbody2D), typeof(Collider2D))]
    public class Bullet2D : MonoBehaviour
    {
        private float damage;
        private int penetrationRemaining;
        private bool isExplosive;
        private float explosionRadius;
        private float explosionDamage;
        private AltarAlignment alignment;
        private float lifesteal;
        private bool infernalBurn;
        private PlayerStats ownerStats;

        public void Initialize(WeaponData data, PlayerStats player, Vector2 velocity)
        {
            damage = data.damage;
            penetrationRemaining = data.penetration;
            isExplosive = data.isExplosive;
            explosionRadius = data.explosionRadius;
            explosionDamage = data.explosionDamage;
            alignment = data.altarAffinity;
            lifesteal = data.lifestealPerHit;
            infernalBurn = data.causesInfernalBurn;
            ownerStats = player;

            GetComponent<Rigidbody2D>().velocity = velocity;
            Destroy(gameObject, 3.5f); // Auto despawn
        }

        private void OnTriggerEnter2D(Collider2D collision)
        {
            if (collision.CompareTag("Zombie"))
            {
                var zombie = collision.GetComponent<ZombieAI>();
                if (zombie != null)
                {
                    // Calculate headshot if hitting head trigger or upper zone
                    bool isHeadshot = collision.gameObject.name.Contains("Head");
                    zombie.TakeDamage(damage, isHeadshot, false);

                    // Sacred Lifesteal trait
                    if (lifesteal > 0f && ownerStats != null)
                    {
                        ownerStats.Heal(lifesteal);
                    }

                    // Cursed Infernal Burn trait
                    if (infernalBurn)
                    {
                        zombie.ApplyBurn(damage * 0.4f, 2.5f);
                    }

                    if (isExplosive)
                    {
                        Detonate();
                        return;
                    }

                    penetrationRemaining--;
                    if (penetrationRemaining <= 0)
                    {
                        Destroy(gameObject);
                    }
                }
            }
            else if (collision.CompareTag("Wall"))
            {
                if (isExplosive) Detonate();
                else Destroy(gameObject);
            }
        }

        private void Detonate()
        {
            Collider2D[] hits = Physics2D.OverlapCircleAll(transform.position, explosionRadius);
            foreach (var h in hits)
            {
                if (h.CompareTag("Zombie"))
                {
                    var z = h.GetComponent<ZombieAI>();
                    if (z != null) z.TakeDamage(explosionDamage, false, false);
                }
            }
            Destroy(gameObject);
        }
    }
}
