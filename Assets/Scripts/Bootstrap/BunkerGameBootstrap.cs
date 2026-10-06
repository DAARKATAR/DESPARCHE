using UnityEngine;
using UnityEngine.UI;
using CodZombies.Player;
using CodZombies.Weapons;
using CodZombies.Enemies;
using CodZombies.Managers;
using CodZombies.World;
using CodZombies.UI;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace CodZombies.Bootstrap
{
    public class BunkerGameBootstrap : MonoBehaviour
    {
        [Header("Auto-Build Options")]
        public bool buildOnStart = true;

        private void Start()
        {
            if (buildOnStart && GameObject.FindWithTag("Player") == null)
            {
                BuildCompleteBunkerGame();
            }
        }

#if UNITY_EDITOR
        [MenuItem("Bunker 115/🚀 Generar Escena Completa Jugable")]
        public static void GenerateSceneFromMenu()
        {
            GameObject bootstrapper = new GameObject("Bunker_Bootstrapper");
            var comp = bootstrapper.AddComponent<BunkerGameBootstrap>();
            comp.BuildCompleteBunkerGame();
            Undo.RegisterCreatedObjectUndo(bootstrapper, "Generate Bunker Scene");
            Selection.activeGameObject = bootstrapper;
        }
#endif

        [ContextMenu("Build Complete Bunker Game")]
        public void BuildCompleteBunkerGame()
        {
            // 1. Procedural Sprites Helper
            Sprite playerSprite = CreateCircleSprite(32, new Color(0.18f, 0.45f, 0.72f), Color.white);
            Sprite zombieSprite = CreateCircleSprite(32, new Color(0.28f, 0.52f, 0.22f), new Color(0.6f, 0.15f, 0.15f));
            Sprite hellhoundSprite = CreateCircleSprite(24, new Color(0.85f, 0.25f, 0.1f), Color.yellow);
            Sprite wallSprite = CreateBoxSprite(32, 32, new Color(0.25f, 0.26f, 0.28f), new Color(0.12f, 0.13f, 0.14f));
            Sprite floorSprite = CreateBoxSprite(64, 64, new Color(0.14f, 0.15f, 0.17f), new Color(0.1f, 0.11f, 0.12f));
            Sprite bulletSprite = CreateBoxSprite(12, 4, Color.yellow, Color.white);
            Sprite boxSprite = CreateBoxSprite(48, 24, new Color(0.55f, 0.38f, 0.18f), Color.yellow);
            Sprite altarSacredSprite = CreateBoxSprite(40, 40, new Color(0.2f, 0.75f, 0.95f), Color.white);
            Sprite altarCursedSprite = CreateBoxSprite(40, 40, new Color(0.85f, 0.15f, 0.2f), Color.black);
            Sprite plankSprite = CreateBoxSprite(28, 6, new Color(0.48f, 0.32f, 0.15f), Color.black);

            // 2. Build Floor & Walls (The Bunker Room)
            GameObject bunkerRoot = new GameObject("--- BUNKER ROOM ---");

            // Floor
            GameObject floor = new GameObject("Bunker_Floor");
            floor.transform.parent = bunkerRoot.transform;
            floor.transform.position = Vector3.zero;
            var floorSR = floor.AddComponent<SpriteRenderer>();
            floorSR.sprite = floorSprite;
            floorSR.drawMode = SpriteDrawMode.Tiled;
            floorSR.size = new Vector2(36f, 26f);
            floorSR.sortingOrder = -10;

            // Walls (North, South, East, West) with Colliders
            CreateWall(bunkerRoot.transform, wallSprite, new Vector2(0f, 13f), new Vector2(36f, 1.5f), "Wall_North");
            CreateWall(bunkerRoot.transform, wallSprite, new Vector2(0f, -13f), new Vector2(36f, 1.5f), "Wall_South");
            CreateWall(bunkerRoot.transform, wallSprite, new Vector2(-18f, 0f), new Vector2(1.5f, 26f), "Wall_West");
            CreateWall(bunkerRoot.transform, wallSprite, new Vector2(18f, 0f), new Vector2(1.5f, 26f), "Wall_East");

            // 3. Bullet Prefab
            GameObject bulletObj = new GameObject("Bullet_Prefab");
            bulletObj.tag = "Bullet";
            var bulletSR = bulletObj.AddComponent<SpriteRenderer>();
            bulletSR.sprite = bulletSprite;
            bulletSR.sortingOrder = 5;
            var bulletCol = bulletObj.AddComponent<BoxCollider2D>();
            bulletCol.isTrigger = true;
            bulletCol.size = new Vector2(0.35f, 0.15f);
            var bulletRB = bulletObj.AddComponent<Rigidbody2D>();
            bulletRB.gravityScale = 0f;
            bulletRB.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            bulletObj.AddComponent<Bullet2D>();
            bulletObj.SetActive(false); // Template prefab

            // 4. Zombie Prefabs (Walker & Hellhound)
            GameObject zombieObj = CreateZombiePrefab("Zombie_Walker_Prefab", zombieSprite, false, 150f, 3.2f);
            GameObject houndObj = CreateZombiePrefab("Zombie_Hellhound_Prefab", hellhoundSprite, true, 85f, 5.5f);

            // 5. Windows / Barricades (4 cardinal points)
            CreateBarricadeObject(bunkerRoot.transform, plankSprite, new Vector2(0f, 11.5f), "Window_North");
            CreateBarricadeObject(bunkerRoot.transform, plankSprite, new Vector2(0f, -11.5f), "Window_South");
            CreateBarricadeObject(bunkerRoot.transform, plankSprite, new Vector2(-16.5f, 0f), "Window_West");
            CreateBarricadeObject(bunkerRoot.transform, plankSprite, new Vector2(16.5f, 0f), "Window_East");

            // 6. Spawn Points outside windows
            GameObject spawnRoot = new GameObject("--- SPAWN POINTS ---");
            Transform sp1 = CreateSpawnPoint(spawnRoot.transform, new Vector2(0f, 15.5f));
            Transform sp2 = CreateSpawnPoint(spawnRoot.transform, new Vector2(0f, -15.5f));
            Transform sp3 = CreateSpawnPoint(spawnRoot.transform, new Vector2(-20.5f, 0f));
            Transform sp4 = CreateSpawnPoint(spawnRoot.transform, new Vector2(20.5f, 0f));

            // 7. Interactive Objects (Mystery Box & Altars)
            GameObject box = new GameObject("Mystery_Box");
            box.tag = "MysteryBox";
            box.transform.position = new Vector2(-6f, 8f);
            var boxSR = box.AddComponent<SpriteRenderer>();
            boxSR.sprite = boxSprite;
            boxSR.sortingOrder = 1;
            var boxCol = box.AddComponent<BoxCollider2D>();
            boxCol.isTrigger = true;
            boxCol.size = new Vector2(2f, 1.2f);
            var mBox = box.AddComponent<MysteryBox>();

            // Altar Sagrado
            GameObject altarS = new GameObject("Altar_Sagrado (Lifesteal)");
            altarS.transform.position = new Vector2(-10f, -8f);
            var asSR = altarS.AddComponent<SpriteRenderer>();
            asSR.sprite = altarSacredSprite;
            asSR.sortingOrder = 1;
            var asCol = altarS.AddComponent<BoxCollider2D>();
            asCol.isTrigger = true;
            asCol.size = new Vector2(1.8f, 1.8f);
            var altSComp = altarS.AddComponent<AltarSystem>();
            altSComp.altarType = AltarAlignment.Sacred;

            // Altar Maldito
            GameObject altarC = new GameObject("Altar_Maldito (Hellfire)");
            altarC.transform.position = new Vector2(10f, -8f);
            var acSR = altarC.AddComponent<SpriteRenderer>();
            acSR.sprite = altarCursedSprite;
            acSR.sortingOrder = 1;
            var acCol = altarC.AddComponent<BoxCollider2D>();
            acCol.isTrigger = true;
            acCol.size = new Vector2(1.8f, 1.8f);
            var altCComp = altarC.AddComponent<AltarSystem>();
            altCComp.altarType = AltarAlignment.Cursed;

            // 8. Player Setup
            GameObject player = new GameObject("Player");
            player.tag = "Player";
            player.transform.position = Vector3.zero;

            var pSR = player.AddComponent<SpriteRenderer>();
            pSR.sprite = playerSprite;
            pSR.sortingOrder = 10;

            var pCol = player.AddComponent<CircleCollider2D>();
            pCol.radius = 0.5f;

            var pRB = player.AddComponent<Rigidbody2D>();
            pRB.gravityScale = 0f;
            pRB.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            pRB.freezeRotation = true;

            var pStats = player.AddComponent<PlayerStats>();
            var pCtrl = player.AddComponent<PlayerController2D>();
            pCtrl.zombieLayer = ~0; // all layers

            // Firepoint for bullets
            GameObject firePt = new GameObject("FirePoint");
            firePt.transform.parent = player.transform;
            firePt.transform.localPosition = new Vector3(0.65f, 0f, 0f);
            pCtrl.firePoint = firePt.transform;

            // Weapon Manager & Default Starting Pistol
            var wMgr = player.AddComponent<WeaponManager>();
            wMgr.firePoint = firePt.transform;
            wMgr.bulletPrefab = bulletObj;

            WeaponData m1911 = ScriptableObject.CreateInstance<WeaponData>();
            m1911.weaponId = "m1911";
            m1911.weaponName = "Colt M1911";
            m1911.papName = "Sally & Mustang";
            m1911.damage = 30f;
            m1911.fireRate = 5.5f;
            m1911.bulletSpeed = 24f;
            m1911.magazineSize = 8;
            m1911.maxReserveAmmo = 32;
            m1911.reloadTime = 1.3f;
            wMgr.startingPistol = m1911;
            wMgr.EquipWeapon(m1911);

            // Populate Mystery Box Weapons
            WeaponData mp40 = ScriptableObject.CreateInstance<WeaponData>();
            mp40.weaponId = "mp40";
            mp40.weaponName = "MP-40";
            mp40.papName = "The Afterburner";
            mp40.damage = 45f;
            mp40.fireRate = 9.5f;
            mp40.bulletSpeed = 26f;
            mp40.magazineSize = 32;
            mp40.maxReserveAmmo = 192;
            mp40.isAutomatic = true;

            WeaponData raygun = ScriptableObject.CreateInstance<WeaponData>();
            raygun.weaponId = "raygun";
            raygun.weaponName = "Ray Gun Mark I";
            raygun.papName = "Porter's X2 Ray Gun";
            raygun.damage = 350f;
            raygun.fireRate = 4f;
            raygun.bulletSpeed = 28f;
            raygun.magazineSize = 20;
            raygun.maxReserveAmmo = 160;
            raygun.isExplosive = true;
            raygun.explosionRadius = 3.5f;
            raygun.explosionDamage = 350f;

            mBox.availableWeapons.Add(m1911);
            mBox.availableWeapons.Add(mp40);
            mBox.availableWeapons.Add(raygun);

            // 9. Managers (RoundManager & PowerUpManager)
            GameObject mgrRoot = new GameObject("--- MANAGERS ---");
            var roundMgr = mgrRoot.AddComponent<RoundManager>();
            roundMgr.zombiePrefab = zombieObj;
            roundMgr.hellhoundPrefab = houndObj;
            roundMgr.spawnPoints.Add(sp1);
            roundMgr.spawnPoints.Add(sp2);
            roundMgr.spawnPoints.Add(sp3);
            roundMgr.spawnPoints.Add(sp4);

            mgrRoot.AddComponent<PowerUpManager>();

            // 10. Camera Follow
            Camera cam = Camera.main;
            if (cam == null)
            {
                GameObject camObj = new GameObject("Main Camera");
                cam = camObj.AddComponent<Camera>();
                cam.tag = "MainCamera";
            }
            cam.orthographic = true;
            cam.orthographicSize = 9f;
            cam.backgroundColor = new Color(0.08f, 0.08f, 0.1f);
            var camFollow = cam.gameObject.GetComponent<SmoothCameraFollow>();
            if (camFollow == null) camFollow = cam.gameObject.AddComponent<SmoothCameraFollow>();
            camFollow.target = player.transform;

            // 11. Complete UI Canvas (DOOM / Disco Elysium Portrait HUD)
            BuildUI(player, pStats, wMgr, pCtrl);

            Debug.Log("<color=green><b>[Bunker 115]</b> ¡Escena generada exitosamente con Jugador, Búnker, Barricadas, Armas e Interfaz!</color>");
        }

        private void CreateWall(Transform parent, Sprite sprite, Vector2 pos, Vector2 size, string name)
        {
            GameObject w = new GameObject(name);
            w.tag = "Wall";
            w.transform.parent = parent;
            w.transform.position = pos;
            var sr = w.AddComponent<SpriteRenderer>();
            sr.sprite = sprite;
            sr.drawMode = SpriteDrawMode.Tiled;
            sr.size = size;
            sr.sortingOrder = 2;
            var col = w.AddComponent<BoxCollider2D>();
            col.size = size;
        }

        private void CreateBarricadeObject(Transform parent, Sprite plankSprite, Vector2 pos, string name)
        {
            GameObject b = new GameObject(name);
            b.tag = "Barricade";
            b.transform.parent = parent;
            b.transform.position = pos;
            var col = b.AddComponent<BoxCollider2D>();
            col.isTrigger = true;
            col.size = new Vector2(2.5f, 2.5f);
            var bar = b.AddComponent<Barricade>();

            bar.plankVisuals = new GameObject[6];
            for (int i = 0; i < 6; i++)
            {
                GameObject plank = new GameObject($"Plank_{i + 1}");
                plank.transform.parent = b.transform;
                plank.transform.localPosition = new Vector3(0f, -0.6f + (i * 0.24f), 0f);
                var psr = plank.AddComponent<SpriteRenderer>();
                psr.sprite = plankSprite;
                psr.sortingOrder = 3;
                bar.plankVisuals[i] = plank;
            }
        }

        private Transform CreateSpawnPoint(Transform parent, Vector2 pos)
        {
            GameObject sp = new GameObject("SpawnPoint");
            sp.transform.parent = parent;
            sp.transform.position = pos;
            return sp.transform;
        }

        private GameObject CreateZombiePrefab(string name, Sprite sprite, bool isHound, float hp, float speed)
        {
            GameObject z = new GameObject(name);
            z.tag = "Zombie";
            var sr = z.AddComponent<SpriteRenderer>();
            sr.sprite = sprite;
            sr.sortingOrder = 8;
            var col = z.AddComponent<CircleCollider2D>();
            col.radius = isHound ? 0.35f : 0.5f;
            var rb = z.AddComponent<Rigidbody2D>();
            rb.gravityScale = 0f;
            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            rb.freezeRotation = true;
            var ai = z.AddComponent<ZombieAI>();
            ai.maxHealth = hp;
            ai.currentHealth = hp;
            ai.moveSpeed = speed;
            ai.isHellhound = isHound;
            z.SetActive(false); // Template prefab
            return z;
        }

        private void BuildUI(GameObject player, PlayerStats pStats, WeaponManager wMgr, PlayerController2D pCtrl)
        {
            GameObject canvasObj = new GameObject("Canvas_HUD");
            Canvas canvas = canvasObj.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvasObj.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasObj.AddComponent<GraphicRaycaster>();

            // HUD Manager
            var hud = canvasObj.AddComponent<GameHUD>();
            hud.playerStats = pStats;
            hud.weaponManager = wMgr;

            // HUD Container panel
            GameObject hudPanel = new GameObject("HUD_Panel");
            hudPanel.transform.parent = canvasObj.transform;
            var panelRect = hudPanel.AddComponent<RectTransform>();
            panelRect.anchorMin = Vector2.zero;
            panelRect.anchorMax = Vector2.one;
            panelRect.offsetMin = Vector2.zero;
            panelRect.offsetMax = Vector2.zero;

            // 1. DOOM / Disco Elysium Portrait Frame
            GameObject portraitObj = new GameObject("Portrait_DOOM_Face");
            portraitObj.transform.parent = hudPanel.transform;
            var pRect = portraitObj.AddComponent<RectTransform>();
            pRect.anchorMin = new Vector2(0f, 0f);
            pRect.anchorMax = new Vector2(0f, 0f);
            pRect.pivot = new Vector2(0f, 0f);
            pRect.anchoredPosition = new Vector2(25f, 25f);
            pRect.sizeDelta = new Vector2(110f, 130f);

            var portraitImg = portraitObj.AddComponent<Image>();
            portraitImg.sprite = CreateDoomFaceSprite(new Color(0.9f, 0.75f, 0.65f), 0);

            var portraitCtrl = portraitObj.AddComponent<DoomPortraitController>();
            portraitCtrl.playerStats = pStats;
            portraitCtrl.playerController = pCtrl;
            portraitCtrl.portraitImage = portraitImg;
            portraitCtrl.tier1_Healthy = CreateDoomFaceSprite(new Color(0.9f, 0.78f, 0.68f), 0);
            portraitCtrl.tier2_LightHurt = CreateDoomFaceSprite(new Color(0.85f, 0.72f, 0.62f), 1);
            portraitCtrl.tier3_Bloody = CreateDoomFaceSprite(new Color(0.8f, 0.5f, 0.45f), 2);
            portraitCtrl.tier4_Battered = CreateDoomFaceSprite(new Color(0.65f, 0.35f, 0.35f), 3);
            portraitCtrl.tier5_Critical = CreateDoomFaceSprite(new Color(0.5f, 0.2f, 0.2f), 4);
            portraitCtrl.tier0_Downed = CreateDoomFaceSprite(new Color(0.3f, 0.3f, 0.3f), 5);
            portraitCtrl.ouchFaceSprite = CreateDoomFaceSprite(new Color(1f, 0.3f, 0.3f), 2);

            Font defaultFont = Resources.GetBuiltinResource<Font>("Arial.ttf");
            if (defaultFont == null) defaultFont = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

            // 2. Round Counter (Top Left)
            GameObject roundObj = new GameObject("Text_Round");
            roundObj.transform.parent = hudPanel.transform;
            var rRect = roundObj.AddComponent<RectTransform>();
            rRect.anchorMin = new Vector2(0f, 1f);
            rRect.anchorMax = new Vector2(0f, 1f);
            rRect.pivot = new Vector2(0f, 1f);
            rRect.anchoredPosition = new Vector2(25f, -25f);
            rRect.sizeDelta = new Vector2(250f, 60f);
            var rText = roundObj.AddComponent<Text>();
            rText.text = "I";
            if (defaultFont != null) rText.font = defaultFont;
            rText.fontSize = 42;
            rText.color = new Color(0.95f, 0.2f, 0.2f);
            hud.roundText = rText;

            // 3. Points Counter (Bottom Left next to Portrait)
            GameObject ptsObj = new GameObject("Text_Points");
            ptsObj.transform.parent = hudPanel.transform;
            var ptsRect = ptsObj.AddComponent<RectTransform>();
            ptsRect.anchorMin = new Vector2(0f, 0f);
            ptsRect.anchorMax = new Vector2(0f, 0f);
            ptsRect.pivot = new Vector2(0f, 0f);
            ptsRect.anchoredPosition = new Vector2(150f, 25f);
            ptsRect.sizeDelta = new Vector2(200f, 40f);
            var ptsText = ptsObj.AddComponent<Text>();
            ptsText.text = "500";
            if (defaultFont != null) ptsText.font = defaultFont;
            ptsText.fontSize = 28;
            ptsText.color = new Color(1f, 0.85f, 0.2f);
            hud.pointsText = ptsText;

            // 4. Weapon & Ammo Counter (Bottom Right)
            GameObject ammoObj = new GameObject("Text_Ammo");
            ammoObj.transform.parent = hudPanel.transform;
            var aRect = ammoObj.AddComponent<RectTransform>();
            aRect.anchorMin = new Vector2(1f, 0f);
            aRect.anchorMax = new Vector2(1f, 0f);
            aRect.pivot = new Vector2(1f, 0f);
            aRect.anchoredPosition = new Vector2(-25f, 25f);
            aRect.sizeDelta = new Vector2(250f, 50f);
            var aText = ammoObj.AddComponent<Text>();
            aText.alignment = TextAnchor.LowerRight;
            aText.text = "8 / 32";
            if (defaultFont != null) aText.font = defaultFont;
            aText.fontSize = 34;
            aText.color = Color.white;
            hud.ammoText = aText;
        }

        private Sprite CreateCircleSprite(int size, Color fillColor, Color outlineColor)
        {
            Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            float r = size / 2f;
            Vector2 c = new Vector2(r, r);

            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float d = Vector2.Distance(new Vector2(x, y), c);
                    if (d <= r - 2f) tex.SetPixel(x, y, fillColor);
                    else if (d <= r) tex.SetPixel(x, y, outlineColor);
                    else tex.SetPixel(x, y, Color.clear);
                }
            }
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), size);
        }

        private Sprite CreateBoxSprite(int w, int h, Color fill, Color border)
        {
            Texture2D tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    bool isBorder = (x == 0 || x == w - 1 || y == 0 || y == h - 1);
                    tex.SetPixel(x, y, isBorder ? border : fill);
                }
            }
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 32);
        }

        private Sprite CreateDoomFaceSprite(Color skin, int damageStage)
        {
            int s = 32;
            Texture2D tex = new Texture2D(s, s, TextureFormat.RGBA32, false);

            for (int y = 0; y < s; y++)
            {
                for (int x = 0; x < s; x++)
                {
                    Color p = skin;
                    // Hair
                    if (y >= 24) p = new Color(0.2f, 0.15f, 0.1f);
                    // Eyes
                    else if ((y == 18 || y == 19) && ((x >= 8 && x <= 11) || (x >= 20 && x <= 23))) p = Color.white;
                    else if ((y == 18) && (x == 10 || x == 22)) p = Color.black;
                    // Mouth
                    else if (y == 8 && x >= 11 && x <= 20) p = (damageStage >= 2) ? new Color(0.5f, 0.05f, 0.05f) : new Color(0.35f, 0.15f, 0.15f);

                    // Blood wounds based on damageStage
                    if (damageStage >= 1 && (x == 12 && y <= 16 && y >= 11)) p = new Color(0.7f, 0.1f, 0.1f);
                    if (damageStage >= 2 && (x == 20 && y <= 21 && y >= 14)) p = new Color(0.8f, 0.1f, 0.1f);
                    if (damageStage >= 3 && y <= 10 && x >= 14 && x <= 18) p = new Color(0.65f, 0.08f, 0.08f);

                    // Border
                    if (x == 0 || x == s - 1 || y == 0 || y == s - 1) p = Color.black;

                    tex.SetPixel(x, y, p);
                }
            }
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.5f), s);
        }
    }

    public class SmoothCameraFollow : MonoBehaviour
    {
        public Transform target;
        public float smoothSpeed = 8f;
        public Vector3 offset = new Vector3(0f, 0f, -10f);

        private void LateUpdate()
        {
            if (target != null)
            {
                Vector3 desired = target.position + offset;
                transform.position = Vector3.Lerp(transform.position, desired, smoothSpeed * Time.deltaTime);
            }
        }
    }
}
