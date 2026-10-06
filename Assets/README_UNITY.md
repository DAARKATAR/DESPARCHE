# 🧟‍♂️ Bunker 115 - Port a Unity 2D / 2.5D

Este directorio contiene todos los sistemas y mecánicas desarrollados para **Bunker 115 (COD Zombies + Disco Elysium + DOOM)**, listos para compilar y usar en **Unity Engine**.

---

## 🚀 Cómo abrir este proyecto en Unity Hub

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/DAARKATAR/DESPARCHE.git
   ```
2. **Abrir en Unity Hub:**
   - Abre **Unity Hub**.
   - Haz clic en **Add** (o *Add project from disk*).
   - Selecciona la carpeta del repositorio (`DESPARCHE`).
   - Elige una versión de Unity (recomendado: **Unity 2022 LTS** o **Unity 6** en plantilla **2D Core**).

3. **Compilación automática:**
   - Unity compilará automáticamente todos los scripts en `Assets/Scripts/`.
   - Podrás hacer `git pull` en cualquier momento para recibir nuevas mecánicas y mejoras.

---

## 🏷️ Tags y Layers requeridos en Unity

Para que las colisiones y la IA funcionen correctamente, ve a **Edit > Project Settings > Tags and Layers** y crea los siguientes Tags:

* `Player` (asignar al GameObject del Jugador)
* `Zombie` (asignar al Prefab de los Zombis)
* `Barricade` (asignar a las ventanas con barricadas)
* `Wall` (asignar a las paredes del búnker)

---

## 📦 Estructura de Scripts (`Assets/Scripts/`)

### 1. Jugador (`Assets/Scripts/Player/`)
* **`PlayerController2D.cs`**:
  * Movimiento fluido WASD.
  * Apuntado con el cursor del mouse (`ScreenToWorldPoint`).
  * Sprint con consumo y recuperación de estamina (`Left Shift`).
  * Ataque cuerpo a cuerpo con cuchillo (`[Space]` o `[E]`).
* **`PlayerStats.cs`**:
  * Salud máxima, daño recibido, regeneración tras delay.
  * Puntos de juego y estadísticas (bajas, tiros a la cabeza).
  * Soporte para perks (Juggernog, Speed Cola, Double Tap, Quick Revive, Stamin-Up).
  * Alineación ritual: **Neutral**, **Sagrado** o **Maldito**.

### 2. Armas y Balística (`Assets/Scripts/Weapons/`)
* **`WeaponData.cs`** (`ScriptableObject`):
  * Define pistolas, escopetas, fusiles y Wonder Weapons (Ray Gun).
  * Configuración de cadencia, daño, perdigones, penetración, cargador y recarga.
* **`WeaponManager.cs`**:
  * Inventario de 2 armas, cambio con `[Q]` o scroll.
  * Disparo manual o automático con dispersión de retroceso.
* **`Bullet2D.cs`**:
  * Trayectoria, penetración, detección de daño.
  * Soporte de robo de vida (*Sacred*) y daño por fuego infernal (*Cursed*).

### 3. Zombis y Oleadas (`Assets/Scripts/Enemies/` & `Managers/`)
* **`ZombieAI.cs`**:
  * Máquina de estados: patrullaje, ataque a barricadas o persecución del jugador.
  * Multiplicador por tiro a la cabeza (Headshots).
  * Probabilidad de soltar Power-Ups al morir.
* **`RoundManager.cs`**:
  * Spawner progresivo de rondas con escalado de salud.
  * Rondas especiales de perros infernales (Hellhounds).
  * Cuenta regresiva de intermisión entre rondas.

### 4. Mundo y Mecánicas (`Assets/Scripts/World/`)
* **`Barricade.cs`**: Ventanas de 6 tablones reconstruibles manteniendo pulsado `[F]`.
* **`MysteryBox.cs`**: Ruleta de armas aleatorias por 950 puntos con probabilidad de oso de peluche.
* **`AltarSystem.cs`**: Sistema de rituales:
  * **Altar Sagrado**: Concede robo de vida (+4 HP por impacto) y proyectiles dorados.
  * **Altar Maldito**: Concede daño devastador (+180%) y quemadura infernal.
* **`PowerUpManager.cs`**: Max Ammo, Insta-Kill, Double Points, Nuke y Carpenter.

### 5. Interfaz Gráfica (`Assets/Scripts/UI/`)
* **`DoomPortraitController.cs`**:
  * Retrato dinámico estilo **Disco Elysium**.
  * 6 fases de salud estilo clásico **DOOM** (100%, 75%, 50%, 25%, crítico, caído).
  * Reacción de dolor (*Ouch face*) al recibir daño.
  * Morfología según alineación (**Aureola celestial** para el Lado Sagrado / **Cuernos demoníacos** para el Lado Maldito).
* **`GameHUD.cs`**: Marcador de rondas (números romanos/marcas), puntos, munición y barras de estado.

---

## 🔄 Flujo de Trabajo con Git

Cada vez que hagamos mejoras:
1. Yo actualizo o creo nuevos scripts en el repositorio.
2. En tu terminal o GitHub Desktop ejecutas:
   ```bash
   git pull
   ```
3. Unity detecta los cambios y los compila en vivo.
