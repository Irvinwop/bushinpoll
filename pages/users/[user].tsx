import {
  Avatar,
  Box,
  Container,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tab,
  TabProps,
  Tabs,
  TabsProps,
  Tooltip,
  Typography,
} from "@mui/material"
import { GetServerSideProps, NextPage } from "next"
import { User } from "next-auth"

import { gsap } from "gsap"
import React, { useEffect, useLayoutEffect } from "react"
import { Icon } from "@iconify/react"
import { useRouter } from "next/router"
import { styled } from "@mui/material/styles"
import admin from "../../firebase/adminApp"
import { useSmash } from "../../lib/SmashContext"
import { usePokemonPicture } from "../../lib/utils"
import { getDatabase, ref, get, onValue } from "firebase/database"
import { createFirebaseApp } from "../../firebase/clientApp"
import Link from "../../src/Link"
import PokemonSquare from "../../components/PokemonSquare"
import Image from "next/image"
import { ScoreDisplay } from "../../components/SmashPass"
import Head from "next/head"
import useSWR from "swr"

const ScoreHolder = styled("div")`
  background-position: center;
  background-size: 80%;
  background-repeat: no-repeat;
  background-color: #10151a;
  padding: 5px;
  display: flex;
  flex-direction: column;
  justify-content: end;
  align-items: center;
  font-weight: 700;
`

interface Error {
  error: string
}

type UserProp = User | string
type ScoreProp = { choices: { [key: string]: "smash" | "pass" }; smashCount: number; passCount: number }
type ScoreError = string
interface Props {
  user: UserProp
}

const tl = gsap.timeline({ repeat: -1 })
const fetcher = (url: string) => fetch(url).then((res) => res.json())
const UserProfile: NextPage<Props> = ({ user }) => {
  const db = getDatabase(createFirebaseApp())
  const { style } = useSmash()
  const pictureBgRef = React.useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { data: score, error: scoreError } = useSWR<ScoreProp, ScoreError>(
    typeof user === "object" && `/api/user/score?user=${user.name.toLowerCase()}`,
    fetcher
  )
  const [tab, setTab] = React.useState<number>(1)
  const [numSmashed, setNum] = React.useState(0)
  useEffect(() => {
    if (typeof user === "string") {
      return
    }
  }, [user])
  useEffect(() => {
    if (pictureBgRef.current) {
      tl.fromTo(
        pictureBgRef.current,
        { scale: 1, autoAlpha: 1, borderWidth: 8 },
        { scale: 1.25, autoAlpha: 0, duration: 2, borderWidth: 0, ease: "cubic.bounce" }
      )
      tl.play()
    }
  }, [pictureBgRef])

  if (typeof user === "string") {
    return <div className="w-full h-full flex flex-col items-center justify-center">{user}</div>
  } else if (scoreError || !score) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        {scoreError || "Unknown Error Occured."}
      </div>
    )
  } else
    return (
      <>
        <Head>
          <title>{`PokeSmash - ${user.name}'s Stats`}</title>
          <meta name="title" content={`PokeSmash - ${user.name}'s Stats`} />
          <meta
            name="description"
            content={`The user page for ${user.name}. Shows the Smashes and Passes they chose.`}
          />
        </Head>
        <Stack
          className="poke-scrollbar"
          sx={{ overflowX: "hidden", maxHeight: "100vh", minHeight: "1080px" }}
          direction="column"
          p={6}
          pb={2}
          alignItems="center">
          <Tooltip className="absolute top-24 left-4" title="Go Back">
            <IconButton className="fancy-bg w-10 h-10 p-0 m-0" LinkComponent={Link} href="/">
              <Icon icon="fa-solid:arrow-left" />
            </IconButton>
          </Tooltip>
          <div className="flex flex-row gap-6 items-center w-11/12 my-2 md:my-4 lg:my-6 ">
            <div
              ref={pictureBgRef}
              className="rounded-full absolute w-16 h-16 md:w-24 md:h-24 xl:w-32 xl:h-32 border-purple-700"
            />
            <Avatar
              className=" w-16 h-16 md:w-24 md:h-24 xl:w-32 xl:h-32 "
              alt={user?.name}
              src={user?.profileImageUrl}
            />

            <Typography
              fontSize={32}
              className="border-purple-500 border-4 select-none flex flex-row items-center gap-2 border-solid rounded-lg px-4 bg-purple-500 text-white"
              fontWeight={600}>
              <IconButton
                className="p-0 m-0"
                sx={{ fontSize: "inherit" }}
                onClick={() => router.push(`https://twitch.tv/${user?.displayName}`, {}, { shallow: true })}>
                <Icon icon="fa-brands:twitch" display="inline-block" />
              </IconButton>{" "}
              {user.displayName}
            </Typography>
            <div className="flex-grow" />
            <Typography fontSize={32} fontWeight={600} justifySelf="flex-end" alignSelf="flex-end">
              {score.passCount + score.smashCount || "?"} / 868
            </Typography>
          </div>
          <StyledTabs
            value={tab}
            variant="fullWidth"
            onChange={(e, nTab) => setTab(nTab)}
            sx={{ width: "100%" }}
            aria-label="User's Stats, Smash list, and Pass list.">
            <StyledTab
              icon={<Image src="https://cdn.7tv.app/emote/60aeafcb229664e866bef5ac/4x" width={32} height={32} />}
              label="Passes"
              iconPosition="start"
            />
            <StyledTab
              icon={<Image src="https://cdn.7tv.app/emote/611a4aac62a016377dd91a25/4x" width={32} height={32} />}
              label="Stats"
              iconPosition="start"
            />
            <StyledTab
              icon={<Image src="https://cdn.7tv.app/emote/60b8cce455c320f0e89d3514/4x" width={32} height={32} />}
              label="Smashes"
              iconPosition="start"
            />
          </StyledTabs>
          <div
            className="flex-grow w-full"
            style={{
              borderRadius: "0 0 0.625rem 0.625rem",
              border: "1px solid #55df55",
              borderTop: "none",
            }}>
            {!scoreError ? (
              tab === 1 ? (
                <StatsPage smashes={score.smashCount} passes={score.passCount} />
              ) : (
                <Grid
                  container
                  spacing={2}
                  p={0}
                  sx={{
                    pt: 2,
                    pl: 2,
                    maxHeight: "100%",
                    overflowX: "hidden",
                    overflowY: "scroll",
                  }}
                  columns={{ xs: 8, sm: 18, md: 24, lg: 60 }}>
                  {Object.keys(score.choices)
                    .filter((val) => score.choices[val] === (tab === 2 ? "smash" : "pass"))
                    .map((id) => (
                      <Grid item xs={2} sm={3} md={3} lg={4} key={id}>
                        <PokemonSquare i={Number(id)} choice={tab === 2 ? "smash" : "pass"} style={style} />
                      </Grid>
                    ))}
                </Grid>
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-2xl font-semibold">
                {scoreError}
              </div>
            )}
          </div>
        </Stack>
      </>
    )
}
export default UserProfile

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const { user } = context.query as { user: string }
  const firestore = admin.firestore()
  const users = firestore.collection("users")
  const userInfo = await users
    .where("username", "==", user.toLowerCase())
    .get()
    .then((q) => {
      const doc = q.docs[0]
      if (doc?.exists) {
        const data = doc.data()
        delete data.email
        return data
      } else {
        return "User not found"
      }
    })

  const props = {
    user: userInfo,
  }
  return {
    props: JSON.parse(JSON.stringify(props)),
  }
}

interface StyledTabsProps extends TabsProps {
  children?: React.ReactNode
  value: number
  onChange: (event: React.SyntheticEvent, newValue: number) => void
}

const StyledTabs = styled((props: StyledTabsProps) => (
  <Tabs {...props} TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" /> }} />
))({
  minHeight: "4em",
  "& div[role='tablist']": {
    gap: "0.25rem",

    justifyContent: "space-between",
  },
  borderBottom: "1px solid #55df55",
  "& .MuiTabs-indicator": {
    display: "flex",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  "& .MuiTabs-indicatorSpan": {
    maxWidth: 40,
    width: "100%",
    backgroundColor: "#635ee7",
  },
})

interface StyledTabProps extends TabProps {
  label: string
}

const StyledTab = styled((props: StyledTabProps) => <Tab {...props} />)(({ theme }) => ({
  border: "1px solid #55df55",
  borderBottom: "none",
  transition: "all 0.2s",
  borderRadius: "0.625rem 0.625rem 0 0",
  display: "flex",
  flexDirection: "row",
  gap: 4,
  boxShadow: "none",
  textTransform: "none",
  fontWeight: theme.typography.fontWeightBold,
  fontSize: theme.typography.pxToRem(15),
  color: "rgba(255, 255, 255, 0.7)",
  "&.Mui-selected": {
    color: "#fff",
    borderWidth: 2,
  },
  "&.Mui-focusVisible": {
    backgroundColor: "rgba(100, 95, 228, 0.32)",
  },
}))

interface StatsPageProps {
  smashes: number
  passes: number
}

function StatsPage(props: StatsPageProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-12">
      <Typography fontSize={32} fontWeight={700}>
        More Stats Coming soon...
      </Typography>
      <div className="flex flex-row justify-around w-full">
        <div className="flex flex-col gap-4 items-center">
          <Typography variant="h3" component="h3" fontWeight={600}>
            Passes
          </Typography>
          <ScoreDisplay className="passes p-12 text-5xl">{props.passes}</ScoreDisplay>
        </div>
        <div className="text-opacity-75 text-green-400 rounded-full outline outline-1 outline-current  w-1 fancy-bg" />
        <div className="flex flex-col gap-4 items-center ">
          <Typography variant="h3" component="h3" fontWeight={600}>
            Smashes
          </Typography>
          <ScoreDisplay className="smashes p-12 text-5xl">{props.smashes}</ScoreDisplay>
        </div>
      </div>
    </div>
  )
}
