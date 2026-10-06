using System.IO;
using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using CodZombies.Bootstrap;

namespace CodZombies.Editor
{
    [InitializeOnLoad]
    public static class BunkerAutoSceneSetup
    {
        static BunkerAutoSceneSetup()
        {
            EditorApplication.delayCall += AutoSetupScene;
        }

        [MenuItem("Bunker 115/📁 Crear y Abrir Escena Bunker115.unity")]
        public static void ForceCreateAndOpenScene()
        {
            CreateSceneInternal(true);
        }

        private static void AutoSetupScene()
        {
            CreateSceneInternal(false);
        }

        private static void CreateSceneInternal(bool forceRecreate)
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode || EditorApplication.isPlaying)
            {
                return;
            }

            EnsureTagsExist();

            string scenesDir = "Assets/Scenes";
            string scenePath = "Assets/Scenes/Bunker115.unity";

            if (!Directory.Exists(scenesDir))
            {
                Directory.CreateDirectory(scenesDir);
                AssetDatabase.Refresh();
            }

            if (forceRecreate || !File.Exists(scenePath))
            {
                // Create a clean new scene with Default GameObjects (Camera + Light)
                var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);

                // Build complete game objects
                GameObject bootstrapper = new GameObject("Bunker_Bootstrapper");
                var comp = bootstrapper.AddComponent<BunkerGameBootstrap>();
                comp.buildOnStart = false; // already built in editor
                comp.BuildCompleteBunkerGame();

                // Save scene to Assets/Scenes/Bunker115.unity
                EditorSceneManager.SaveScene(scene, scenePath);
                AssetDatabase.Refresh();

                Debug.Log("<color=green><b>[Bunker 115]</b> ¡Escena guardada con éxito en <b>Assets/Scenes/Bunker115.unity</b>!</color>");
            }

            // If the current active scene is not Bunker115, open it
            if (EditorSceneManager.GetActiveScene().path != scenePath && File.Exists(scenePath))
            {
                EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
                Debug.Log("<color=cyan><b>[Bunker 115]</b> Abierta escena <b>Bunker115.unity</b>.</color>");
            }
        }

        private static void EnsureTagsExist()
        {
            var assets = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset");
            if (assets == null || assets.Length == 0) return;

            SerializedObject tagManager = new SerializedObject(assets[0]);
            SerializedProperty tagsProp = tagManager.FindProperty("tags");
            if (tagsProp == null) return;

            string[] requiredTags = new string[] { "Player", "Zombie", "Barricade", "Wall", "Bullet", "MysteryBox" };

            foreach (string t in requiredTags)
            {
                bool found = false;
                for (int i = 0; i < tagsProp.arraySize; i++)
                {
                    SerializedProperty tEntry = tagsProp.GetArrayElementAtIndex(i);
                    if (tEntry.stringValue.Equals(t)) { found = true; break; }
                }
                if (!found)
                {
                    tagsProp.InsertArrayElementAtIndex(tagsProp.arraySize);
                    tagsProp.GetArrayElementAtIndex(tagsProp.arraySize - 1).stringValue = t;
                }
            }
            tagManager.ApplyModifiedProperties();
        }
    }
}
