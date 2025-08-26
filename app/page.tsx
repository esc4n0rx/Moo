"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Volume2, VolumeX } from "lucide-react"
import { fetchInitialGlobalCount, registerMooClick } from "@/lib/moo" // Ajuste o caminho se necessário

export default function CowSoundPage() {
  // Contadores
  const [clickCount, setClickCount] = useState(0)
  const [globalCount, setGlobalCount] = useState(0)

  // Estados da UI e áudio
  const [isMuted, setIsMuted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Estados de erro
  const [audioError, setAudioError] = useState(false)
  const [globalError, setGlobalError] = useState(false)

  // Refs para a Web Audio API
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  // Efeito para inicializar áudio, carregar dados locais e globais
  useEffect(() => {
    // Inicializa o contexto de áudio
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        gainNodeRef.current = audioContextRef.current.createGain()
        gainNodeRef.current.connect(audioContextRef.current.destination)

        const response = await fetch("/moo.mp3")
        const arrayBuffer = await response.arrayBuffer()
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer)
      } catch (error) {
        console.error("Failed to initialize audio:", error)
        setAudioError(true)
      }
    }

    // Carrega dados do localStorage
    const savedMuted = localStorage.getItem("cowMuted")
    if (savedMuted) setIsMuted(JSON.parse(savedMuted))
    
    const savedCount = localStorage.getItem("cowClickCount")
    if (savedCount) setClickCount(Number.parseInt(savedCount, 10))

    // Busca o contador global inicial
    const loadGlobalCount = async () => {
      setGlobalError(false)
      const initialGlobalCount = await fetchInitialGlobalCount()
      setGlobalCount(initialGlobalCount)
    }
    
    initAudio()
    loadGlobalCount()
  }, [])

  // Efeito para controlar o volume (mudo/não mudo)
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : 1
    }
    localStorage.setItem("cowMuted", JSON.stringify(isMuted))
  }, [isMuted])

  // Efeito para salvar o contador local no localStorage
  useEffect(() => {
    localStorage.setItem("cowClickCount", clickCount.toString())
  }, [clickCount])

  // Função para tocar o som
  const playMooSound = useCallback(async () => {
    if (!audioContextRef.current || !audioBufferRef.current || !gainNodeRef.current) {
      setAudioError(true)
      return
    }
    try {
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume()
      }
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBufferRef.current
      source.connect(gainNodeRef.current)
      source.start(0)
    } catch (error) {
      console.error("Failed to play sound:", error)
      setAudioError(true)
    }
  }, [])

  // Função principal que lida com o clique na vaca
  const handleCowClick = useCallback(async () => {
    // 1. Atualiza a UI localmente (imediato)
    setClickCount((prev) => prev + 1)
    playMooSound()
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 200)

    // 2. Envia o clique para a API e atualiza o contador global (assíncrono)
    const newGlobalCount = await registerMooClick()
    if (newGlobalCount !== null) {
      setGlobalCount(newGlobalCount)
      setGlobalError(false)
    } else {
      setGlobalError(true) // Mostra erro se a API falhar
    }
  }, [playMooSound])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleCowClick()
    }
  }, [handleCowClick])

  const toggleMute = useCallback(() => setIsMuted((prev) => !prev), [])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 p-3 rounded-full bg-secondary hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label={isMuted ? "Ativar som" : "Silenciar som"}
      >
        {isMuted ? <VolumeX className="w-6 h-6 text-muted-foreground" /> : <Volume2 className="w-6 h-6 text-foreground" />}
      </button>

      <div className="flex flex-col items-center space-y-8 max-w-md mx-auto text-center">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Muuuu!</h1>
          <p className="text-lg text-muted-foreground">Clique na vaca.</p>
        </div>

        <button
          onClick={handleCowClick}
          onKeyDown={handleKeyDown}
          className={`
            relative w-40 h-40 md:w-48 md:h-48 rounded-full 
            bg-gradient-to-br from-gray-200 to-gray-300
            border-4 border-gray-400
            transition-all duration-200 ease-out
            focus:outline-none focus:ring-4 focus:ring-orange-400 focus:ring-offset-4
            flex items-center justify-center overflow-hidden
            ${isAnimating ? "scale-95 shadow-inner" : "hover:scale-105 shadow-lg"}
          `}
          aria-label="Tocar mugido da vaca"
        >
          
          <Image
            src="/moo.jpg"
            alt="Vaca fofa"
            fill
            className="object-contain"
            priority // Carrega a imagem principal de forma prioritária
            sizes="(max-width: 768px) 10rem, 12rem"
          />
          {isAnimating && <div className="absolute inset-0 rounded-full bg-orange-400 opacity-30 animate-ping" />}
        </button>

        {/* Contadores */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-8 text-xl font-semibold text-foreground">
          <p>
            Suas Mugidas: <span className="text-orange-600 font-bold">{clickCount.toLocaleString("pt-BR")}</span>
          </p>
          <p>
            Mugidas Globais: <span className="text-blue-600 font-bold">{globalCount.toLocaleString("pt-BR")}</span>
          </p>
        </div>
        
        {/* Mensagens de Erro */}
        {audioError && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">Não consegui tocar o som. Verifique o volume.</p>
          </div>
        )}
        {globalError && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-600">Erro ao sincronizar com o contador global. Tentando novamente...</p>
          </div>
        )}
      </div>
    </div>
  )
}