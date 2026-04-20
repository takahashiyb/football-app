<script lang="ts" setup>
import { resolveTextColor } from '@/assets/util/color'
import LoadingBall from '@/components/LoadingBall.vue'
import { supabase } from '@/lib/supabase'
import { onBeforeMount, ref, useId } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const isLoading = ref<boolean>(true)

const idList: { [key: string]: number } = {
  'premier-league': 17,
  'la-liga': 8,
  bundesliga: 35,
  'ligue-1': 34,
  'seria-a': 23,
}

const leagueTable = ref()

function getDescendingStandings() {
  return (leagueTable.value.standings[0].rows as Team[]).sort(
    (acc, curr) =>
      acc.position - curr.position ||
      -(acc.points - curr.points) ||
      -(curr.scoresFor - curr.scoresAgainst - (curr.scoresFor - curr.scoresAgainst)),
  )
}

function getTopOfLeague() {
  const standings: Team[] = getDescendingStandings()
  const first = standings[0]

  return standings.filter((item) => item.points === first?.points).at(-1)
}

let maxGames: number = 0

onBeforeMount(async () => {
  const { data, error } = await supabase
    .from('league-data')
    .select('*')
    .eq('api_id', idList[route.query.league as string])

  if (error) {
    console.error(error)
  } else {
    leagueTable.value = JSON.parse(data[0].data)

    setTimeout(() => {
      isLoading.value = false
    }, 2000)

    getMaxGames()

    getTopOfLeague()
  }
})

function getMaxGames() {
  maxGames = (leagueTable.value.standings[0].rows.length - 1) * 2
}

const isCheckboxOpen = ref<boolean>(true)

const isStatsOpen = ref<boolean>(true)

const isQualificationOpen = ref<boolean>(false)

const isTimelinesOpen = ref<boolean>(true)

function getTimelinesSelectOpen() {
  if (isTimelinesOpen.value && isCheckboxOpen.value) return true

  return false
}

const whichTimelineOpen = ref<'league' | 'ucl' | 'el' | 'rel'>('league')

function getMaxPoints(position: number) {
  const team: Team = leagueTable.value.standings[0]?.rows[position - 1]

  return (maxGames - team!.matches) * 3 + team!.points
}

function getPoints(position: number) {
  const points = leagueTable.value.standings[0]?.rows[position - 1]?.points

  return points ? points : 0
}

function getMaxPlayed() {
  const max = Object.values(leagueTable.value.standings[0]!.rows as Team).reduce((a, b) =>
    a.matches > b.matches ? a : b,
  )

  return max.matches
}

function getMinPlayed() {
  const min = Object.values(leagueTable.value.standings[0]!.rows as Team).reduce((a, b) =>
    a.matches < b.matches ? a : b,
  )

  return min.matches
}

function getGoalDifference(team: Team) {
  return team.scoresFor - team.scoresAgainst
}

function getClLastSpot() {
  const lastSPot = Object.values(leagueTable.value.standings[0]!.rows as Team)
    .filter((team) => team.promotion?.id === 804 || team.promotion?.id === 24)
    .reduce((acc, curr) => (acc.position > curr.position ? acc : curr))

  return lastSPot.position
}

// 503 for conference league

function getElLastSpot() {
  const lastSPot = Object.values(leagueTable.value.standings[0]!.rows as Team)
    .filter((team) => team.promotion?.id === 808)
    .reduce((acc, curr) => (acc.position > curr.position ? acc : curr))

  return lastSPot.position
}

function getRelTopSpot() {
  const topSPot = Object.values(leagueTable.value.standings[0]!.rows as Team)
    .filter((team) => team.promotion?.id === 3)
    .reduce((acc, curr) => (acc.position < curr.position ? acc : curr))

  return topSPot.position
}

function getRemainingMatches() {
  return maxGames - getMinPlayed() + 1
}

function closeCheckbox() {
  isCheckboxOpen.value = !isCheckboxOpen.value
}

interface Bar {
  class?: string
  span: number
  value?: string | number
}

interface Team {
  team: {
    name: string
    slug: string
    shortName: string
    gender: string
    sport: {
      name: string
      slug: string
      id: number
    }
    userCount: number
    nameCode: string
    disabled: boolean
    national: boolean
    type: number
    country: {
      alpha2: string
      alpha3: string
      name: string
      slug: string
    }
    id: number
    teamColors: {
      primary: string
      secondary: string
      text: string
    }
    fieldTranslations?: Object
  }
  descriptions: never[]
  promotion?: {
    text?: string
    id?: number
  }
  position: number
  matches: number
  wins: number
  scoresFor: number
  scoresAgainst: number
  id: number
  losses: number
  draws: number
  points: number
  scoreDiffFormatted: string
}

// Retrieves various bar for graphs to display positions of teams for honors/qualifications
function getLeagueRace(team: Team) {
  const id = useId()

  function current() {
    return {
      class: 'current-points',
      span: team.matches - getMinPlayed() + 1,
      value: `${team.points}`,
    } as Bar
  }

  function champ() {
    const position = team.position
    const points = team.points
    const secondMaxPoints = getMaxPoints(2)

    if (position !== 1 || points > secondMaxPoints) {
      return { span: 0 }
    }

    const secondTeam = getDescendingStandings()[1]
    const pointsToWin = Math.ceil((secondMaxPoints - points) / 3)
    const totalPointsToWin = pointsToWin * 3 + points

    return {
      class: 'take-league',
      span: pointsToWin,
      value: `${totalPointsToWin} ${secondMaxPoints === totalPointsToWin && getGoalDifference(team) < getGoalDifference(secondTeam!) ? `+${getGoalDifference(team) - getGoalDifference(secondTeam!)}GD` : ''}`,
    } as Bar
  }

  function eplChaser() {
    const pointsFirst = getPoints(1)
    const max = getMaxPoints(team.position)

    if (pointsFirst > max || team.position <= 1) {
      return { span: 0 }
    }

    const gamesOfUncontestedWins = Math.ceil((pointsFirst - team.points) / 3)

    return {
      class: 'overtake-league',
      span: gamesOfUncontestedWins,
      value: gamesOfUncontestedWins * 3 + team.points,
    } as Bar
  }

  function eplEmpty() {
    return {
      class: 'emptybar',
      span: maxGames - (getMinPlayed() + (current().span - 1 + eplChaser().span + champ().span)),
      value: 0,
    } as Bar
  }

  function ucl() {
    const positionLastUclSpot = getClLastSpot()
    const pointsLeadingChaser = getPoints(positionLastUclSpot + 1)
    const maxLeadingChaser = getMaxPoints(positionLastUclSpot + 1)
    const max = getMaxPoints(team.position)
    const position = team.position
    const points = team.points

    if (pointsLeadingChaser > max || position > positionLastUclSpot || points >= maxLeadingChaser) {
      return { span: 0 }
    }

    const gamesOfUncontestedWins = Math.ceil((maxLeadingChaser - getPoints(position) + 1) / 3)

    return {
      class: 'take-cl',
      span: gamesOfUncontestedWins,
      value: gamesOfUncontestedWins * 3 + points,
    } as Bar
  }

  function uclChaser() {
    const pointsLastUclSpot = getPoints(getClLastSpot())
    const positionLastUclSpot = getClLastSpot()
    const max = getMaxPoints(team.position)

    if (pointsLastUclSpot > max || team.position <= positionLastUclSpot) {
      return { span: 0 }
    }

    const gamesOfUncontestedWins = Math.ceil((pointsLastUclSpot - team.points) / 3)

    return {
      class: 'overtake-cl',
      span: gamesOfUncontestedWins,
      value: gamesOfUncontestedWins * 3 + team.points,
    } as Bar
  }

  function uclEmpty() {
    return {
      class: 'emptybar',
      span: maxGames - (team.matches + uclChaser().span + ucl().span),
      value: 0,
    } as Bar
  }

  function el() {
    const positionLastElSpot = getElLastSpot()
    const pointsLastElSpot = getPoints(positionLastElSpot)
    const maxLastElSpot = getMaxPoints(positionLastElSpot)
    const points = team.points
    const max = getMaxPoints(team.position)

    if (pointsLastElSpot > max || team.position <= positionLastElSpot || points >= maxLastElSpot) {
      return { span: 0 }
    }

    const gamesOfUncontestedWins = Math.ceil((pointsLastElSpot - points) / 3)

    return {
      class: 'take-el',
      span: gamesOfUncontestedWins,
      value: gamesOfUncontestedWins * 3 + points,
    } as Bar
  }

  function elChaser() {
    const positionLeadingElChaser = getElLastSpot()
    const pointsLeadingElChaser = getPoints(positionLeadingElChaser + 1)
    const max = getMaxPoints(team.position)

    if (pointsLeadingElChaser > max || team.position !== positionLeadingElChaser) {
      return { span: 0 }
    }

    const gamesOfUncontestedWins = Math.ceil(
      (getMaxPoints(positionLeadingElChaser) - getPoints(team.position)) / 3,
    )

    return {
      class: 'overtake-el',
      span: gamesOfUncontestedWins,
      value: gamesOfUncontestedWins * 3 + team.points,
    } as Bar
  }

  function elEmpty() {
    return {
      class: 'emptybar',
      span: maxGames - (getMinPlayed() + (current().span - 1 + elChaser().span + el().span)),
      value: 0,
    } as Bar
  }

  function demotion() {
    const maxPoints = getMaxPoints(team.position)
    const positionAboveRel = getRelTopSpot() - 1
    const pointsAboveRel = getPoints(positionAboveRel)

    if (pointsAboveRel >= maxPoints || team.position <= positionAboveRel) {
      return { span: 0 }
    }

    const points = team.points

    const gamesOfUncontestedWins = Math.ceil((pointsAboveRel - points) / 3)

    return {
      class: 'safe-relegation',
      span: gamesOfUncontestedWins,
      value: gamesOfUncontestedWins * 3 + points,
    } as Bar
  }

  function demotionEscape() {
    const positionTopRelSpot = getRelTopSpot()
    const points = getPoints(team.position)
    const maxTopRelSpot = getMaxPoints(positionTopRelSpot)

    if (points > maxTopRelSpot || team.position >= positionTopRelSpot) return { span: 0 }

    const gamesOfUncontestedWins = Math.ceil((maxTopRelSpot - points + 1) / 3)

    return {
      class: 'exit-relegation',
      span: gamesOfUncontestedWins,
      value: gamesOfUncontestedWins * 3 + team.points,
    } as Bar
  }

  function demotionEmpty() {
    return {
      class: 'emptybar',
      span:
        maxGames -
        (getMinPlayed() + (current().span - 1 + demotion().span + demotionEscape().span)),
      value: 0,
    } as Bar
  }

  return {
    id,
    current,
    champ,
    eplChaser,
    eplEmpty,
    ucl,
    uclChaser,
    uclEmpty,
    el,
    elChaser,
    elEmpty,
    demotion,
    demotionEscape,
    demotionEmpty,
  }
}
</script>

<template>
  <LoadingBall v-if="isLoading" />
  <div
    v-if="!isLoading"
    class="title"
    :style="{
      '--primary': leagueTable.standings[0]?.tournament.uniqueTournament.primaryColorHex,
      '--secondary': leagueTable.standings[0]?.tournament.uniqueTournament.secondaryColorHex,
    }"
  >
    <h1>
      {{ leagueTable.standings[0]?.name }}
    </h1>
    <p class="h1-subtext">
      {{ leagueTable.standings[0]?.tournament.category.name }}
    </p>
  </div>
  <div v-if="!isLoading" class="container__checkboxes">
    <div class="close__checkbox">
      <span class="sr-only">click to {{ isCheckboxOpen ? 'close' : 'open' }} display options</span>
      <span @click="closeCheckbox">{{ isCheckboxOpen ? 'Close' : 'Open' }}</span>
    </div>
    <label v-if="isCheckboxOpen">
      <input type="checkbox" v-model="isStatsOpen" />
      {{ `${isStatsOpen ? 'Close' : 'Open'} Point Tally` }}
    </label>
    <label v-if="isCheckboxOpen">
      <input type="checkbox" v-model="isQualificationOpen" />
      {{ `${isQualificationOpen ? 'Close' : 'Open'} Qualification Tally` }}
    </label>
    <label v-if="isCheckboxOpen">
      <input type="checkbox" v-model="isTimelinesOpen" />
      {{ `${isTimelinesOpen ? 'Close' : 'Open'} Timelines` }}
    </label>
    <select v-model="whichTimelineOpen" v-if="getTimelinesSelectOpen()" name="timeline-group">
      <option name="timeline" value="league">Title Race</option>
      <option name="timeline" value="ucl">UEFA Champions League Race</option>
      <option name="timeline" value="el">Europa League Race</option>
      <option name="timeline" value="rel">Relegation Battle</option>
    </select>
  </div>
  <div class="table-padder">
    <div v-if="!isLoading" class="container__table">
      <table>
        <colgroup>
          <col class="colgroup__position" />
          <col class="colgroup__teamname" />
          <col class="colgroup__teamcode" />
          <col span="6" class="colgroup__stats" :class="{ closed: !isStatsOpen }" />
          <col span="9" class="colgroup__qualification" :class="{ closed: !isQualificationOpen }" />
          <col
            :span="getRemainingMatches()"
            class="colgroup__league"
            :class="{ closed: !isTimelinesOpen || whichTimelineOpen !== 'league' }"
          />
          <col
            :span="getRemainingMatches()"
            class="colgroup__cl"
            :class="{ closed: !isTimelinesOpen || whichTimelineOpen !== 'ucl' }"
          />
          <col
            :span="getRemainingMatches()"
            class="colgroup__europa"
            :class="{ closed: !isTimelinesOpen || whichTimelineOpen !== 'el' }"
          />
          <col
            class="colgroup__relegation"
            :class="{ closed: !isTimelinesOpen || whichTimelineOpen !== 'rel' }"
            :span="getRemainingMatches()"
          />
        </colgroup>
        <thead>
          <tr>
            <th colspan="3" class="col__team-position1"></th>
            <th colspan="6"></th>
            <th colspan="9"></th>
            <th id="header__league" :colspan="getRemainingMatches()">
              League Title Timeline (Matchweek)
            </th>
            <th id="header__ucl" :colspan="getRemainingMatches()">
              Champions League Timeline (Matchweek)
            </th>
            <th id="header__eul" :colspan="getRemainingMatches()">Europa Timeline (Matchweek)</th>
            <th id="header__ecl" :colspan="getRemainingMatches()">
              Relegation Timeline (Matchweek)
            </th>
          </tr>
          <tr>
            <th>POS</th>
            <th colspan="2" class="col__team-position2">TEAM</th>
            <th>GP</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>PTS</th>
            <th>GD</th>
            <th>MAX PTS</th>
            <th>🔒 1st</th>
            <th>PTS to 1st</th>
            <th>🔒 UCL</th>
            <th>PTS to UCL</th>
            <th>🔒 EL</th>
            <th>PTS to EL</th>
            <th>🔒 SPOT</th>
            <th>OUT of REL</th>
            <th class="matchweek" v-for="(value, index) in getRemainingMatches()" :key="value">
              {{ `${getMinPlayed() + index}` }}
            </th>
            <th class="matchweek" v-for="(value, index) in getRemainingMatches()" :key="value">
              {{ `${getMinPlayed() + index}` }}
            </th>
            <th class="matchweek" v-for="(value, index) in getRemainingMatches()" :key="value">
              {{ `${getMinPlayed() + index}` }}
            </th>
            <th class="matchweek" v-for="(value, index) in getRemainingMatches()" :key="value">
              {{ `${getMinPlayed() + index}` }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            class="position"
            v-for="team in getDescendingStandings()"
            :key="team.id"
            :style="{
              '--primary-team-color': team.team.teamColors.primary,
              '--secondary-team-color': team.team.teamColors.secondary,
              '--primary-text-color': resolveTextColor(
                team.team.teamColors.primary,
                team.team.teamColors.secondary,
                team.team.teamColors.text,
                true,
              ),
              '--secondary-text-color': resolveTextColor(
                team.team.teamColors.primary,
                team.team.teamColors.secondary,
                team.team.teamColors.text,
                false,
              ),
            }"
          >
            <template v-for="leaguePos in [getLeagueRace(team)]" :key="leaguePos.id">
              <td
                :class="{
                  promotion__cl: team.promotion?.id === 804 || team.promotion?.id === 24,
                  promotion__el: team.promotion?.id === 808,
                  relegation: team.promotion?.id === 3,
                }"
              >
                {{ team.position }}
              </td>
              <td class="team__name">
                {{ team.team.name.toUpperCase() }}
              </td>
              <td class="team__code">
                {{ team.team.nameCode }}
              </td>
              <td
                :class="[
                  'stats',
                  {
                    toPlayFor: getMaxPlayed() > team.matches, 
                  },
                ]"
              >
                {{ team.matches }}
              </td>
              <td :class="['stats']">{{ team.wins }}</td>
              <td :class="['stats']">{{ team.draws }}</td>
              <td :class="['stats']">{{ team.losses }}</td>
              <td :class="['stats']">{{ team.points }}</td>
              <td :class="['stats']">{{ team.scoreDiffFormatted }}</td>
              <!-- Max Points -->
              <td :class="['stats']">{{ getMaxPoints(team.position) }}</td>
              <!-- to Secure 1st place -->
              <td :class="['stats']">
                {{ team.position === 1 ? getMaxPoints(2) - team.points : '' }}
              </td>
              <!-- to overtake 1st place -->
              <td :class="['stats']">
                {{
                  getPoints(1) <= getMaxPoints(team.position) && team.position !== 1
                    ? getPoints(1) - team.points
                    : ''
                }}
              </td>
              <!-- to secure UCL place -->
              <td :class="['stats']">
                {{
                  getPoints(5) <= getMaxPoints(team.position) && team.position < 5
                    ? getMaxPoints(5) - getPoints(team.position) + 1
                    : ''
                }}
              </td>
              <!-- to overtake UCL place -->
              <td :class="['stats']">
                {{
                  getPoints(4) <= getMaxPoints(team.position) && team.position > 4
                    ? getPoints(4) - team.points
                    : ''
                }}
              </td>
              <!-- to secure Europa place -->
              <td :class="['stats']">
                {{
                  getPoints(6) <= getMaxPoints(team.position) && team.position === 5
                    ? getMaxPoints(6) - getPoints(team.position) + 1
                    : ''
                }}
              </td>
              <!-- to overtake Europa place -->
              <td :class="['stats']">
                {{
                  getPoints(5) <= getMaxPoints(team.position) && team.position > 5
                    ? getPoints(5) - team.points
                    : ''
                }}
              </td>
              <!-- to secure PL place -->
              <td :class="['stats']">
                {{
                  getPoints(team.position) <= getMaxPoints(18) && team.position < 18
                    ? getMaxPoints(18) - getPoints(team.position) + 1
                    : ''
                }}
              </td>
              <!-- to escape relegation -->
              <td :class="['stats']">
                {{
                  getPoints(getRelTopSpot() - 1) < getMaxPoints(team.position) &&
                  team.position > getRelTopSpot() - 1
                    ? leaguePos.demotion().value
                    : ''
                }}
              </td>
              <!-- Bar graphs for League Champ -->
              <td
                :class="['bar-graph', 'league-timeline', leaguePos.current().class]"
                :colspan="leaguePos.current().span"
                v-if="leaguePos.current().span !== 0"
                :style="`transition: transform ${1.5 * (leaguePos.current().span / getMinPlayed())}s linear`"
              >
                {{ leaguePos.current().value }}
              </td>

              <td
                :class="['bar-graph', 'league-timeline', leaguePos.champ().class]"
                :colspan="leaguePos.champ().span"
                v-if="leaguePos.champ().span !== 0"
                :style="`transition: transform ${1.5 * (leaguePos.champ().span / getMinPlayed())}s linear ${1.5 * (leaguePos.current().span / getMinPlayed())}s`"
              >
                {{ leaguePos.champ().value }}
              </td>

              <td
                :class="['bar-graph', 'league-timeline', leaguePos.eplChaser().class]"
                :colspan="leaguePos.eplChaser().span"
                v-if="leaguePos.eplChaser().span !== 0"
                :style="`transition: transform ${1.5 * (leaguePos.eplChaser().span / getMinPlayed())}s linear ${1.5 * (leaguePos.current().span / getMinPlayed())}s`"
              >
                {{ leaguePos.eplChaser().value }}
              </td>

              <td
                :class="['bar-graph', 'league-timeline', leaguePos.eplEmpty().class]"
                :colspan="leaguePos.eplEmpty().span"
                v-if="leaguePos.eplEmpty().span !== 0"
              ></td>

              <!-- Bargraphs for UCL -->

              <td
                :class="['bar-graph', 'ucl-timeline', leaguePos.current().class]"
                :colspan="leaguePos.current().span"
                v-if="leaguePos.current().span !== 0"
                :style="`transition: transform ${1.5 * (leaguePos.current().span / getMinPlayed())}s linear`"
              >
                {{ leaguePos.current().value }}
              </td>

              <td
                :class="['bar-graph', 'ucl-timeline', leaguePos.ucl().class]"
                :colspan="leaguePos.ucl().span"
                v-if="leaguePos.ucl().span !== 0"
                :style="`transition: transform ${1.5 * (leaguePos.ucl().span / getMinPlayed())}s linear ${1.5 * (leaguePos.current().span / getMinPlayed())}s`"
              >
                {{ leaguePos.ucl().value }}
              </td>

              <td
                :class="['bar-graph', 'ucl-timeline', leaguePos.uclChaser().class]"
                :colspan="leaguePos.uclChaser().span"
                v-if="leaguePos.uclChaser().span !== 0"
                :style="`transition: transform ${1.5 * (leaguePos.uclChaser().span / getMinPlayed())}s linear ${1.5 * (leaguePos.current().span / getMinPlayed())}s`"
              >
                {{ leaguePos.uclChaser().value }}
              </td>

              <td
                :class="['bar-graph', leaguePos.uclEmpty().class]"
                :colspan="leaguePos.uclEmpty().span"
                v-if="leaguePos.uclEmpty().span !== 0"
              ></td>

              <!-- Bargraphs for EUL -->

              <td
                :class="['bar-graph', 'europa-timeline', leaguePos.current().class]"
                :colspan="leaguePos.current().span"
                v-if="leaguePos.current().span !== 0"
                :style="`transition: transform ${1.5 * (leaguePos.current().span / getMinPlayed())}s linear`"
              >
                {{ leaguePos.current().value }}
              </td>

              <td
                :class="['bar-graph', 'europa-timeline', leaguePos.el().class]"
                :colspan="leaguePos.el().span"
                v-if="leaguePos.el().span !== 0"
                :style="`transition: transform ${1.5 * (leaguePos.el().span / getMinPlayed())}s linear ${1.5 * (leaguePos.current().span / getMinPlayed())}s`"
              >
                {{ leaguePos.el().value }}
              </td>

              <td
                :class="['bar-graph', 'europa-timeline', leaguePos.elChaser().class]"
                :colspan="leaguePos.elChaser().span"
                v-if="leaguePos.elChaser().span !== 0"
                :style="`transition: transform ${1.5 * (leaguePos.elChaser().span / getMinPlayed())}s linear ${1.5 * (leaguePos.current().span / getMinPlayed())}s`"
              >
                {{ leaguePos.elChaser().value }}
              </td>

              <td
                :class="['bar-graph', leaguePos.elEmpty().class]"
                :colspan="leaguePos.elEmpty().span"
                v-if="leaguePos.elEmpty().span !== 0"
              ></td>

              <!-- Bargraphs for Relegation -->

              <td
                :class="['bar-graph', 'relegation-timeline', leaguePos.current().class]"
                :colspan="leaguePos.current().span"
                v-if="leaguePos.current().span !== 0"
                :style="`transition: transform ${1.5 * (leaguePos.current().span / getMinPlayed())}s linear`"
              >
                {{ leaguePos.current().value }}
              </td>

              <td
                :class="['bar-graph', 'relegation-timeline', leaguePos.demotion().class]"
                :colspan="leaguePos.demotion().span"
                v-if="leaguePos.demotion().span !== 0"
                :style="`transition: transform ${1.5 * (leaguePos.demotion().span / getMinPlayed())}s linear ${1.5 * (leaguePos.current().span / getMinPlayed())}s`"
              >
                {{ leaguePos.demotion().value }}
              </td>

              <td
                :class="['bar-graph', 'relegation-timeline', leaguePos.demotionEscape().class]"
                :colspan="leaguePos.demotionEscape().span"
                v-if="leaguePos.demotionEscape().span !== 0"
                :style="`transition: transform ${1.5 * (leaguePos.demotionEscape().span / getMinPlayed())}s linear ${1.5 * (leaguePos.current().span / getMinPlayed())}s`"
              >
                {{ leaguePos.demotionEscape().value }}
              </td>

              <td
                :class="['bar-graph', leaguePos.demotionEmpty().class]"
                :colspan="leaguePos.demotionEmpty().span"
                v-if="leaguePos.demotionEmpty().span >= 0"
              ></td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title {
  --primary: white;
  --secondary: black;
  --text: white;

  background-image: linear-gradient(
    135deg,
    var(--primary) 70%,
    var(--secondary) 70%,
    var(--primary) 75%,
    var(--primary) 75%,
    var(--secondary) 75%,
    var(--primary) 80%,
    var(--primary) 80%,
    var(--secondary) 80%,
    var(--primary)
  );

  padding-top: v.$spacing-0600;
  padding-bottom: v.$spacing-0400;
  padding-inline: v.$spacing-0400;
}

.title h1 {
  padding-bottom: v.$spacing-0100;
}

.container__checkboxes {
  background-color: hsl(var(--primary-bg-color));

  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;

  margin: v.$spacing-0400;
  margin-inline: v.$spacing-1000;

  position: sticky;
  top: v.$spacing-0400;
  z-index: 99;

  padding-top: 1em;
  padding-bottom: 1em;
  padding-inline: v.$spacing-0400;

  border-bottom: 1px hsl(var(--primary-brdr-color)) solid;
  border-radius: 12px;

  box-shadow: -4px 0px 16px hsla(var(--emphasis-color), 0.4) inset;
}

.close__checkbox {
  grid-row: 1;
  grid-column: 1/3;

  justify-self: end;

  cursor: pointer;
}

.container__checkboxes label {
  white-space: nowrap;
  width: min-content;
}

select {
  width: min-content;
  padding: v.$spacing-0100;
  background-color: hsl(var(--primary-bg-color));

  border-radius: 4px;
  border-color: hsl(var(--primary-brdr-color));
  outline: none;
}

select:focus-visible {
  border-color: hsl(var(--primary-brdr-color));
}

.table-padder {
  background-color: hsl(var(--primary-bg-color));

  padding: v.$spacing-0400;

  border-radius: 12px;

  margin-inline: v.$spacing-0400;

  border-bottom: 1px hsl(var(--primary-brdr-color)) solid;

  box-shadow: -4px 0px 16px hsla(var(--emphasis-color), 0.4) inset;
}

.container__table {
  overflow: auto;
  scrollbar-width: none;
}

table {
  --position-width: 2em;
  --teamname-width: 25em;

  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
  overflow-x: hidden;
  width: 100%;
}

tr td:nth-child(1),
tr td:nth-child(2):nth-child(3) {
  background-color: hsl(var(--primary-bg-color));
}

th {
  background-color: hsl(var(--primary-bg-color));
  vertical-align: bottom;
}

td {
  width: 100px;

  text-align: center;

  padding: 0.5em;

  transform-origin: left;
}

.colgroup__position {
  width: var(--position-width);
}

.colgroup__teamname {
  position: sticky;
  left: calc(2em + 2px);
  width: var(--teamname-width);
}

.colgroup__teamcode {
  position: sticky;
  left: calc(25em + 2px);
  width: 3em;
}

.colgroup__stats,
.colgroup__qualification {
  width: 2.5em;
}

.colgroup__relegation,
.colgroup__europa,
.colgroup__cl,
.colgroup__league {
  width: 4em;
}

table th:nth-child(1),
table td:nth-child(1) {
  position: sticky;
  left: 0;
}

table tr:nth-child(2) th:nth-child(2),
table td:nth-child(2) {
  position: sticky;
  left: calc(var(--position-width));
}

table td:nth-child(3) {
  position: sticky;
  left: calc(var(--position-width) + var(--teamname-width));
}

.team__name,
.team__name--spacer {
  height: 100%;

  padding-top: 0.5em;
  padding-bottom: 0.5em;
}

.team__name {
  white-space: nowrap;
  text-align: start;
  padding-left: 0.5em;
  padding-right: 7em;
}

.colgroup__stats.closed,
.colgroup__qualification.closed,
.colgroup__relegation.closed,
.colgroup__europa.closed,
.colgroup__cl.closed,
.colgroup__league.closed {
  visibility: collapse;
}

.colgroup__league.closed ~ tbody .league-timeline,
.colgroup__cl.closed ~ tbody .ucl-timeline,
.colgroup__europa.closed ~ tbody .europa-timeline,
.colgroup__relegation.closed ~ tbody .relegation-timeline {
  transform: scaleX(0);
}

.team__name {
  background-image: linear-gradient(
    135deg,
    var(--primary-team-color) 70%,
    var(--secondary-team-color) 70%,
    var(--primary-team-color) 75%,
    var(--primary-team-color) 75%,
    var(--secondary-team-color) 75%,
    var(--primary-team-color) 80%,
    var(--primary-team-color) 80%,
    var(--secondary-team-color) 80%
  );
}

.team__name {
  background-color: var(--primary-team-color);
  color: var(--primary-text-color);
}

.team__code {
  background-color: var(--secondary-team-color);
  color: var(--secondary-text-color);
}

tr td.promotion__cl {
  --color: blue;
  color: white;
  background-color: var(--color);
}

tr td.promotion__el {
  --color: orange;
  color: white;
  background-color: var(--color);
}

tr td.relegation {
  --color: red;
  color: white;
  background-color: var(--color);
}

.toPlayFor {
  text-decoration: underline;
}

.bar-graph {
  text-align: end;
}

.matchweek {
  padding-inline: 4px;
}

.current-points {
  background-color: var(--primary-team-color);
  color: var(--primary-text-color);

  padding-right: 8px;
  box-shadow: -4px 0px 0 inset (var(--secondary-team-color));
}

.take-league {
  background-color: rgb(242, 207, 9);
  color: white;
}

.overtake-league {
  background-color: rgb(148, 148, 183);
  color: white;
}

.take-cl {
  background-color: rgb(17, 14, 227);
  color: white;
}

.overtake-cl {
  background-color: rgb(102, 101, 149);
  color: white;
}

.take-el {
  background-color: rgb(229, 171, 46);
  color: white;
}

.overtake-el {
  background-color: rgb(196, 202, 104);
  color: white;
}

.safe-relegation {
  background-color: rgb(197, 167, 167);
  color: white;
}

.exit-relegation {
  background-color: rgb(174, 197, 167);
  color: white;
}

@media (max-width: 50em) {
  .team__name,
  .team__name--spacer {
    visibility: collapse;
  }

  table {
    --teamname-width: 0em;
  }
}

@media (max-width: 43.75em) {
  .container__checkboxes {
    grid-template-columns: repeat(1, 1fr);

    margin-inline: v.$spacing-0100;
  }

  .close__checkbox {
    grid-column: 1;
  }

  .table-padder {
    margin-inline: v.$spacing-0200;
  }

  td {
    min-width: 1em;
    padding: 0.1em;
  }
}
</style>
