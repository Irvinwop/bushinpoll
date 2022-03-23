import { Button, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import { css, styled } from "@mui/system";
import { motion } from "framer-motion";
import { Pokemon, PokemonSpecies } from "pokenode-ts";
import React, { ReactElement, RefObject, useState } from "react";
import toast from "react-hot-toast";
import { useHotkeys } from "react-hotkeys-hook";
import useSWR from "swr";

import { pokeClient, useSmash } from "../lib/SmashContext";
import { capitalizeFirstLetter, usePokemonPicture } from "../lib/utils";
import SwipeCards, { SwipeRef } from "./SwipeCards";
import Type, { PokeType } from "./Type";

type Props = { cardRef: RefObject<SwipeRef> }

const MotionText = motion(Typography)

const getBgByType: { [key in PokeType]: string[] } = {
  bug: ['forest'],
  dark: ['city'],
  dragon: ['space'],
  electric: ['thunderplains'],
  fairy: ['space'],
  fighting: ['city', 'meadow'],
  fire: ['volcanocave', 'desert'],
  flying: ['mountain', 'route'],
  ghost: ['earthycave'],
  grass: ['meadow'],
  ground: ['mountain', 'earthycave', 'route'],
  ice: ['icecave'],
  normal: ['route', 'city'],
  poison: ['earthycave'],
  psychic: ['city', 'spl'],
  rock: ['mountain', 'earthycave'],
  steel: ['mountain'],
  water: ['beach', 'beachshore', 'river', 'deepsea'],
}

const PokeCard = styled(Card)`
  height: 100%;
  @media screen and (max-width: 800px) {
    min-width: 100%;
  }

  border-radius: 1.5em;
  box-shadow: 2px 4px 4px -2px #000;

  background-color: transparent;
  background-position: center;
  background-repeat: no-repeat;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
`
const PokeContent = styled(CardContent)`
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: end;
  background: linear-gradient(to top, #000 -5%, transparent 33%);
  width: 100%;
  height: 100%;
  padding: 20px;
  gap: 2;

  & > #pokeName {
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.4);
  }
`

const getBg = (pokeInfo: Pokemon) => {
  return getBgByType[pokeInfo.types[0].type.name as PokeType][Math.floor(Math.random() * getBgByType[pokeInfo.types[0].type.name as PokeType].length)]
}

export default function PokeInfo({ cardRef }: Props) {
  const smashCtx = useSmash() as NonNullable<ReturnType<typeof useSmash>>
  const {
    currentId,
    pokeInfo,
    setCurrentId,
    style,
    score,
    shockRef,
    seenBefore: [seenBefore],
    startCelebration,
  } = smashCtx

  const { data } = useSWR<PokemonSpecies>(
    () => pokeInfo?.species?.name,
    (name: string) => pokeClient.getPokemonSpeciesByName(name)
  )
  const { bgUrl, shiny } = usePokemonPicture()

  useHotkeys(
    'up',
    () => {
      if (currentId > 898) return
      if (currentId < score.currentId) {
        setCurrentId((prev) => prev + 1)
      } else {
        toast("You haven't Smashed or Passed this Pokemon yet!", { id: 'currentId-reached' })
      }
    },
    [currentId]
  )
  useHotkeys(
    'down',
    (e) => {
      if (currentId > 898) return
      if (currentId > 1) {
        setCurrentId((prev) => prev - 1)
      }
    },
    {},
    [currentId]
  )

  const [chosenBg, setBg] = useState(pokeInfo && getBg(pokeInfo))
  React.useEffect(() => {
    if (pokeInfo) {
      setBg(getBg(pokeInfo))
    }
  }, [pokeInfo, style])

  if (currentId === 899) {
    return (
      <div className="cardContainer h-full flex flex-col items-center justify-center">
        <MotionText
          className="select-none w-2/3 md:w-full text-2xl md:text-7xl"
          variant="h2"
          initial={{ scale: 0, rotate: -720, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
          transition={{ duration: 1 }}
          textAlign="center">
          {"Nice! You're a Degenerate!"}
        </MotionText>
        {seenBefore && (
          <Button size="large" variant="contained" className="mt-24" onClick={() => startCelebration(true)}>
            Watch Ending Cutscene Again
          </Button>
        )}
      </div>
    )
  }

  if (!smashCtx || !pokeInfo) {
    return (
      <div
        className="cardContainer h-full flex items-center justify-center"
        style={{
          minWidth: '450px',
          maxHeight: '600px',
        }}>
        <CircularProgress />
      </div>
    )
  }

  return (
    <div className="cardContainer h-full">
      <SwipeCards
        ref={cardRef}
        onSwipe={async (dir: 'left' | 'right' | 'up' | 'down') => {
          if (currentId === 898) {
            return setCurrentId((id) => id + 1)
          } else if (currentId > 898) {
            return
          }
          const amShocked = shouldIBeShocked({ data, pokeInfo, dir })
          if (shockRef.current && amShocked) {
            typeof amShocked !== 'boolean' ? shockRef.current.shocked(cardRef, amShocked) : shockRef.current.shocked(cardRef)
          } else {
            if (!cardRef.current) console.error('CardRef not found!')

            setTimeout(() => cardRef.current?.reset(), 500)
          }
          if (process.env.NODE_ENV === 'development') console.log(dir)
          if (dir === 'left') {
            score.pass()
          } else if (dir === 'right') {
            score.smash()
          }
          setCurrentId((id) => id + 1)
        }}>
        <PokeCard className={''}>
          <div
            style={{
              height: '100%',
              width: '100%',
              position: 'absolute',
              backgroundImage: `url(/backgrounds/bg-${chosenBg || 'beach'}.${chosenBg === 'space' ? 'jpg' : 'png'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'left',
            }}
          />
          <div
            css={css`
              height: 100%;
              width: 100%;
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;

              ${style === 'hd'
                ? `image-rendering: auto;`
                : `image-rendering: -moz-crisp-edges;
            image-rendering: pixelated;
            -ms-interpolation-mode: nearest-neighbor;`}
            `}>
            {bgUrl.includes('substitute') ? (
              <>
                <motion.div style={{ scale: 3 }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <img src={bgUrl} />
                </motion.div>
                <Typography fontWeight={600} color="HighlightText" mt={8}>
                  Loading
                </Typography>
              </>
            ) : (
              <img style={{ transform: style === 'showdown' ? 'scale(400%)' : 'scale(85%)', minWidth: '75px' }} src={bgUrl} />
            )}
          </div>
          {shiny && (
            <div
              style={{
                width: '200%',
                height: '125%',

                transform: 'translateX(-25%) rotate(60deg) ',
                position: 'absolute',
              }}>
              <motion.div
                className={'is-shiny transform-gpu'}
                animate={{ y: ['-150%', '1500%', '-150%'], rotate: [0, 5, 0], scaleY: [2, 1, 2] }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  mass: 0.5,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  repeatDelay: 3,
                }}></motion.div>
            </div>
          )}
          <PokeContent className="select-none absolute w-full">
            <Typography id="pokeName" variant="h4" fontWeight={700} component="h1">
              {capitalizeFirstLetter(pokeInfo.name)}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {pokeInfo.types.map((type, i) => (
                <Type type={type.type.name as any} key={i} />
              ))}
            </Stack>
            <Typography>{data?.flavor_text_entries.find((v) => v.language.name === 'en')?.flavor_text || 'Succelent, Beautiful.'}</Typography>
          </PokeContent>
        </PokeCard>
      </SwipeCards>
    </div>
  )
}

interface ShockedProps {
  data?: PokemonSpecies
  pokeInfo: Pokemon
  dir: 'left' | 'right' | 'up' | 'down'
}

function shouldIBeShocked({ data, pokeInfo, dir }: ShockedProps): boolean | string | ReactElement {
  if (data?.is_baby && dir === 'right') {
    return true
  }
  if (pokeInfo.id === 428 && dir === 'left') {
    return (
      <Typography className="text-center text-lg">
        That was the <span className="text-red-600 font-extrabold">wrong fucking</span> move, kid.
      </Typography>
    )
  }
  return false
}
