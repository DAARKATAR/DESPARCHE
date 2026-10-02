import React, { useState, useEffect } from 'react';
import { multiplayerClient, MultiplayerClient, RemotePlayer } from '../multiplayer/MultiplayerClient';
import { Users, Shield, Copy, Check, Play, ArrowLeft, RefreshCw, AlertCircle, Radio, Server, Settings, ExternalLink } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface MultiplayerLobbyModalProps {
  onClose: () => void;
  onGameStart: () => void;
}

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({ 
  onClose, 
  onGameStart 
}) => {
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('cod_player_name') || `Soldado-${Math.floor(100 + Math.random() * 900)}`;
  });
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [inLobby, setInLobby] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [players, setPlayers] = useState<RemotePlayer[]>([]);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showServerConfig, setShowServerConfig] = useState<boolean>(false);
  const [serverUrlInput, setServerUrlInput] = useState<string>(() => {
    return MultiplayerClient.getEffectiveWsUrl();
  });
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');

  useEffect(() => {
    const handleRoomCreated = (data: any) => {
      setIsConnecting(false);
      setInLobby(true);
      setPlayers(data.players);
      setServerStatus('connected');
      soundEngine.playPointsClink();
    };

    const handleRoomJoined = (data: any) => {
      setIsConnecting(false);
      setInLobby(true);
      setPlayers(data.players);
      setServerStatus('connected');
      soundEngine.playPointsClink();
    };

    const handlePlayerJoined = (data: any) => {
      setPlayers(data.players);
      soundEngine.playMysteryBoxReady();
    };

    const handlePlayerLeft = (data: any) => {
      setPlayers(data.players);
    };

    const handleReadyChanged = (data: any) => {
      setPlayers(data.players);
      soundEngine.playHammerBoard();
    };

    const handleGameStarted = () => {
      soundEngine.ensureContext();
      soundEngine.playRoundStart();
      onGameStart();
    };

    const handleError = (msg: string) => {
      setIsConnecting(false);
      setErrorMessage(msg);
    };

    const handleConnected = () => {
      setServerStatus('connected');
    };

    const handleDisconnected = () => {
      setServerStatus('disconnected');
    };

    multiplayerClient.on('room_created', handleRoomCreated);
    multiplayerClient.on('room_joined', handleRoomJoined);
    multiplayerClient.on('player_joined', handlePlayerJoined);
    multiplayerClient.on('player_left', handlePlayerLeft);
    multiplayerClient.on('player_ready_changed', handleReadyChanged);
    multiplayerClient.on('game_started', handleGameStarted);
    multiplayerClient.on('error', handleError);
    multiplayerClient.on('connected', handleConnected);
    multiplayerClient.on('disconnected', handleDisconnected);

    // Initial check of active connection
    if (multiplayerClient.isConnected) {
      setServerStatus('connected');
    }

    return () => {
      multiplayerClient.off('room_created', handleRoomCreated);
      multiplayerClient.off('room_joined', handleRoomJoined);
      multiplayerClient.off('player_joined', handlePlayerJoined);
      multiplayerClient.off('player_left', handlePlayerLeft);
      multiplayerClient.off('player_ready_changed', handleReadyChanged);
      multiplayerClient.off('game_started', handleGameStarted);
      multiplayerClient.off('error', handleError);
      multiplayerClient.off('connected', handleConnected);
      multiplayerClient.off('disconnected', handleDisconnected);
    };
  }, [onGameStart]);

  const handleTestOrSaveServer = async () => {
    const cleanUrl = serverUrlInput.trim();
    if (!cleanUrl) return;
    localStorage.setItem('bunker_ws_server', cleanUrl);
    setServerStatus('testing');
    setErrorMessage(null);
    try {
      await multiplayerClient.connect(cleanUrl);
      setServerStatus('connected');
      soundEngine.playPointsClink();
    } catch {
      setServerStatus('disconnected');
      setErrorMessage(`No se pudo conectar a ${cleanUrl}. Asegúrate de que el servidor WebSocket esté encendido.`);
    }
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) return;
    localStorage.setItem('cod_player_name', playerName.trim());
    setErrorMessage(null);
    setIsConnecting(true);
    try {
      await multiplayerClient.createRoom(playerName.trim());
    } catch (err: any) {
      setIsConnecting(false);
      const target = multiplayerClient.activeServerUrl || serverUrlInput;
      setErrorMessage(`No se pudo conectar al servidor WebSocket (${target}). Vercel solo aloja la web; el servidor backend debe estar activo en Render, Railway o Cloud Run.`);
      setShowServerConfig(true);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !joinCodeInput.trim()) return;
    localStorage.setItem('cod_player_name', playerName.trim());
    setErrorMessage(null);
    setIsConnecting(true);
    try {
      await multiplayerClient.joinRoom(joinCodeInput.trim().toUpperCase(), playerName.trim());
    } catch (err: any) {
      setIsConnecting(false);
      const target = multiplayerClient.activeServerUrl || serverUrlInput;
      setErrorMessage(`Error al conectar con la sala en (${target}).`);
      setShowServerConfig(true);
    }
  };

  const handleToggleReady = () => {
    multiplayerClient.toggleReady();
  };

  const handleStartGame = () => {
    multiplayerClient.startGame();
  };

  const handleLeaveLobby = () => {
    multiplayerClient.disconnect();
    setInLobby(false);
  };

  const copyRoomCode = () => {
    if (!multiplayerClient.roomId) return;
    navigator.clipboard.writeText(multiplayerClient.roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isHost = multiplayerClient.isHost;
  const myPlayer = players.find(p => p.id === multiplayerClient.playerId);

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="max-w-xl w-full bg-stone-950 border border-stone-800 p-6 sm:p-8 rounded-sm shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="font-['Black_Ops_One'] text-2xl text-stone-100 tracking-wider">
              {inLobby ? `SALA DE OPERACIONES // ${multiplayerClient.roomId}` : 'MULTIJUGADOR EN VIVO'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition-colors cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {/* Server Status Ribbon */}
        <div className="flex items-center justify-between bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-sm text-xs font-mono mb-4 text-stone-300">
          <div className="flex items-center gap-2 truncate max-w-[70%]">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                serverStatus === 'connected'
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                  : serverStatus === 'testing'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
              }`}
            />
            <span className="truncate text-[11px] text-stone-400">
              {MultiplayerClient.getEffectiveWsUrl()}
            </span>
          </div>
          <button
            onClick={() => setShowServerConfig(!showServerConfig)}
            className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer shrink-0 ml-2"
          >
            <Server className="w-3 h-3" />
            {showServerConfig ? 'Ocultar' : 'Ajustar Servidor'}
          </button>
        </div>

        {/* Server Config Drawer */}
        {showServerConfig && (
          <div className="bg-stone-900 border border-amber-500/40 p-3.5 rounded-sm mb-4 text-xs font-mono text-stone-300 flex flex-col gap-2 shadow-lg">
            <div className="font-bold text-amber-400 flex items-center justify-between">
              <span>CONFIGURACIÓN DEL SERVIDOR WEBSOCKET:</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Vercel aloja el frontend (la página), pero el multijugador requiere un servidor Node.js permanente con WebSockets. Puedes usar el servidor Cloud Run predeterminado o tu propio servidor en Render/Railway:
            </p>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={serverUrlInput}
                onChange={(e) => setServerUrlInput(e.target.value)}
                placeholder="wss://mi-servidor.onrender.com/ws"
                className="flex-1 bg-stone-950 border border-stone-700 px-2.5 py-1.5 rounded-sm text-stone-100 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleTestOrSaveServer}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-3 py-1.5 rounded-sm transition-colors cursor-pointer text-xs"
              >
                {serverStatus === 'testing' ? 'Conectando...' : 'Guardar y Probar'}
              </button>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="bg-red-950/80 border border-red-500 text-red-200 px-3.5 py-2 rounded-sm text-xs font-mono flex items-start gap-2 mb-4 leading-relaxed shadow-md">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {!inLobby ? (
          /* Matchmaking Form */
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-xs font-mono text-stone-400 uppercase tracking-widest mb-1.5">
                Nombre de tu Soldado
              </label>
              <input
                type="text"
                maxLength={16}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ej. Richtofen, Nikolai..."
                className="w-full bg-stone-900 border border-stone-700 px-3.5 py-2.5 rounded-sm text-stone-100 font-['Black_Ops_One'] tracking-wider text-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Create Room */}
              <div className="bg-stone-900/60 border border-stone-800 p-4 rounded-sm flex flex-col justify-between hover:border-stone-700 transition-colors">
                <div>
                  <h3 className="font-['Black_Ops_One'] text-base text-stone-200 tracking-wide mb-1">
                    CREAR ESCUADRÓN
                  </h3>
                  <p className="text-xs text-stone-400 font-mono mb-4">
                    Sé el líder del grupo, obtén un código de 4 letras e invita a tus camaradas.
                  </p>
                </div>
                <button
                  onClick={handleCreateRoom}
                  disabled={isConnecting || !playerName.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-800 text-stone-950 disabled:text-stone-600 font-['Black_Ops_One'] text-sm tracking-wider py-2.5 rounded-sm transition-all cursor-pointer shadow-lg"
                >
                  {isConnecting ? 'CONECTANDO...' : 'CREAR SALA'}
                </button>
              </div>

              {/* Option B: Join Room */}
              <div className="bg-stone-900/60 border border-stone-800 p-4 rounded-sm flex flex-col justify-between hover:border-stone-700 transition-colors">
                <div>
                  <h3 className="font-['Black_Ops_One'] text-base text-stone-200 tracking-wide mb-1">
                    UNIRSE A SALA
                  </h3>
                  <p className="text-xs text-stone-400 font-mono mb-3">
                    Introduce el código de 4 caracteres que te compartió el líder.
                  </p>
                  <input
                    type="text"
                    maxLength={4}
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="CÓDIGO (EJ: K115)"
                    className="w-full bg-stone-950 border border-stone-700 px-3 py-1.5 rounded-sm text-center text-stone-100 font-['Black_Ops_One'] tracking-widest text-base mb-3 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  onClick={handleJoinRoom}
                  disabled={isConnecting || !playerName.trim() || !joinCodeInput.trim()}
                  className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 text-stone-950 disabled:text-stone-600 font-['Black_Ops_One'] text-sm tracking-wider py-2.5 rounded-sm transition-all cursor-pointer shadow-lg"
                >
                  {isConnecting ? 'CONECTANDO...' : 'UNIRSE AL COMBATE'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Active Lobby */
          <div className="flex flex-col gap-6">
            {/* Room Code Display */}
            <div className="flex items-center justify-between bg-stone-900/90 border border-stone-700 p-3.5 rounded-sm">
              <div>
                <span className="text-[10px] font-mono text-stone-400 block uppercase tracking-widest">
                  CÓDIGO DE ESCUADRÓN
                </span>
                <span className="font-['Black_Ops_One'] text-3xl text-emerald-400 tracking-widest">
                  {multiplayerClient.roomId}
                </span>
              </div>
              <button
                onClick={copyRoomCode}
                className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-sm text-xs font-mono transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? '¡COPIADO!' : 'COPIAR CÓDIGO'}
              </button>
            </div>

            {/* Players in Lobby */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-2 uppercase tracking-wider">
                <span>Pelotón ({players.length}/4)</span>
                <span>Estado</span>
              </div>
              <div className="flex flex-col gap-2">
                {players.map((pl) => (
                  <div
                    key={pl.id}
                    className="flex items-center justify-between bg-stone-900/60 border border-stone-800 px-3.5 py-2.5 rounded-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className={`w-4 h-4 ${pl.isHost ? 'text-amber-400' : 'text-stone-500'}`} />
                      <span className="font-['Black_Ops_One'] text-stone-100 tracking-wide">
                        {pl.name} {pl.id === multiplayerClient.playerId && '(Tú)'}
                      </span>
                      {pl.isHost && (
                        <span className="text-[10px] font-mono bg-amber-950/80 text-amber-400 border border-amber-600/60 px-1.5 py-0.5 rounded-xs">
                          LÍDER
                        </span>
                      )}
                    </div>
                    <div>
                      {pl.isReady ? (
                        <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> LISTO
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-stone-500">PREPARÁNDOSE...</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lobby Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-800/80">
              <button
                onClick={handleLeaveLobby}
                className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 px-4 py-2 rounded-sm text-xs font-mono transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> SALIR DE LA SALA
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleReady}
                  className={`px-4 py-2 rounded-sm text-xs font-mono font-bold transition-colors cursor-pointer border ${
                    myPlayer?.isReady
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-500'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                  }`}
                >
                  {myPlayer?.isReady ? '✓ ESTOY LISTO' : 'MARCAR LISTO'}
                </button>

                {isHost && (
                  <button
                    onClick={handleStartGame}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-stone-100 font-['Black_Ops_One'] tracking-wider px-5 py-2 rounded-sm text-sm transition-colors cursor-pointer shadow-lg animate-pulse"
                  >
                    <Play className="w-4 h-4 fill-stone-100" /> INICIAR EXPEDICIÓN
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
