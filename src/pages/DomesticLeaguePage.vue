<script lang="ts" setup>
import { standings } from '@/assets/data/spain'
import { resolveTextColor } from '@/assets/util/color'
import { onBeforeMount, ref } from 'vue'

const leagueTable = standings

const maxGames = 38

const isStatsOpen = ref<boolean>(true)

const isQualificationOpen = ref<boolean>(false)

const isTimelinesOpen = ref<boolean>(true)

const whichTimelineOpen = ref<'league' | 'ucl' | 'el' | 'rel'>('league')

function getMaxPoints(position: number) {
  const team = leagueTable.standings[0]?.rows[position - 1]

  return (maxGames - team!.matches) * 3 + team!.points
}

function getPoints(position: number) {
  const points = leagueTable.standings[0]?.rows[position - 1]?.points

  return points ? points : 0
}

function getMaxPlayed() {
  const max = Object.values(leagueTable.standings[0]!.rows).reduce((a, b) =>
    a.matches > b.matches ? a : b,
  )

  return max.matches
}

function getMinPlayed() {
  const min = Object.values(leagueTable.standings[0]!.rows).reduce((a, b) =>
    a.matches < b.matches ? a : b,
  )

  return min.matches
}

function getClLastSpot() {
  const lastSPot = Object.values(leagueTable.standings[0]!.rows)
    .filter((team) => team.promotion?.id === 804)
    .reduce((acc, curr) => (acc.position > curr.position ? acc : curr))

  return lastSPot.position
}

function getElLastSpot() {
  const lastSPot = Object.values(leagueTable.standings[0]!.rows)
    .filter((team) => team.promotion?.id === 808)
    .reduce((acc, curr) => (acc.position > curr.position ? acc : curr))

  return lastSPot.position
}

function getRelTopSpot() {
  const topSPot = Object.values(leagueTable.standings[0]!.rows)
    .filter((team) => team.promotion?.id === 3)
    .reduce((acc, curr) => (acc.position < curr.position ? acc : curr))

  return topSPot.position
}

function getRemainingMatches() {
  return maxGames - getMinPlayed() + 1
}

interface bar {
  class: string
  span: number
  value: number
}

interface team {
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

function getLeagueRace(team: team) {
  const current: bar = {
    class: 'current-points',
    span: team.matches - getMinPlayed() + 1,
    value: team.points,
  }
  const champ: bar = {
    class: 'take-league',
    span:
      getPoints(2) <= getMaxPoints(team.position) && team.position === 1
        ? Math.ceil((getMaxPoints(2) - getPoints(team.position) + 1) / 3) +
          1 -
          (team.matches - getMinPlayed())
        : 0,
    value: Math.ceil((getMaxPoints(2) - getPoints(team.position) + 1) / 3) * 3 + team.points,
  }
  const eplChaser: bar = {
    class: 'overtake-league',
    span:
      getPoints(1) <= getMaxPoints(team.position) && team.position > 1
        ? team.matches -
          getMinPlayed() +
          Math.ceil((getPoints(1) - team.points) / 3) -
          (team.matches - getMinPlayed())
        : 0,
    value: Math.ceil((getPoints(1) - team.points) / 3) * 3 + team.points,
  }

  const eplEmpty: bar = {
    class: 'emptybar',
    span: maxGames - (getMinPlayed() + (current.span - 1 + eplChaser.span + champ.span)),
    value: 0,
  }

  const ucl: bar = {
    class: 'take-cl',
    span:
      getPoints(getClLastSpot() + 1) <= getMaxPoints(team.position) &&
      team.position <= getClLastSpot() &&
      team.points < getMaxPoints(getClLastSpot())
        ? Math.ceil((getMaxPoints(getClLastSpot() + 1) - getPoints(team.position) + 1) / 3)
        : 0,
    value:
      Math.ceil((getMaxPoints(getClLastSpot() + 1) - getPoints(team.position) + 1) / 3) * 3 +
      team.points,
  }

  const uclChaser: bar = {
    class: 'overtake-cl',
    span:
      getPoints(getClLastSpot()) <= getMaxPoints(team.position) && team.position > getClLastSpot()
        ? Math.ceil((getPoints(getClLastSpot()) - team.points) / 3)
        : 0,
    value: Math.ceil((getPoints(getClLastSpot()) - team.points) / 3) * 3 + team.points,
  }

  const uclEmpty: bar = {
    class: 'emptybar',
    span: maxGames - (team.matches + uclChaser.span + ucl.span),
    value: 0,
  }

  const el: bar = {
    class: 'take-el',
    span:
      getPoints(getElLastSpot()) <= getMaxPoints(team.position) &&
      team.position > getElLastSpot() &&
      team.points < getMaxPoints(getElLastSpot())
        ? Math.ceil((getPoints(getElLastSpot()) - team.points) / 3)
        : 0,
    value: Math.ceil((getPoints(getElLastSpot()) - team.points) / 3) * 3 + team.points,
  }

  const elChaser: bar = {
    class: 'overtake-el',
    span:
      getPoints(getElLastSpot() + 1) <= getMaxPoints(team.position) &&
      team.position === getElLastSpot()
        ? Math.ceil((getMaxPoints(getElLastSpot()) - getPoints(team.position)) / 3)
        : 0,
    value:
      Math.ceil((getMaxPoints(getElLastSpot() + 1) - getPoints(team.position)) / 3) * 3 +
      team.points,
  }

  const elEmpty: bar = {
    class: 'emptybar',
    span: maxGames - (getMinPlayed() + (current.span - 1 + elChaser.span + el.span)),
    value: 0,
  }

  const demotion: bar = {
    class: 'safe-relegation',
    span:
      getPoints(getRelTopSpot() - 1) < getMaxPoints(team.position) &&
      team.position > getRelTopSpot() - 1 &&
      team.points < getMaxPoints(getRelTopSpot() - 1)
        ? team.matches -
          getMinPlayed() +
          Math.ceil((getPoints(getRelTopSpot() - 1) - team.points) / 3)
        : 0,
    value: Math.ceil((getPoints(getRelTopSpot() - 1) - team.points) / 3) + team.points,
  }

  const demotionEscape: bar = {
    class: 'exit-relegation',
    span:
      getPoints(team.position) <= getMaxPoints(getRelTopSpot()) && team.position < getRelTopSpot()
        ? team.matches -
          getMinPlayed() +
          Math.ceil((getMaxPoints(getRelTopSpot()) - getPoints(team.position) + 1) / 3)
        : 0,
    value:
      Math.ceil((getMaxPoints(getRelTopSpot()) - getPoints(team.position) + 1) / 3) * 3 +
      team.points,
  }

  const demotionEmpty: bar = {
    class: 'emptybar',
    span: maxGames - (getMinPlayed() + (current.span - 1 + demotion.span + demotionEscape.span)),
    value: 0,
  }

  return {
    current: current,
    champ: champ,
    eplChaser: eplChaser,
    eplEmpty: eplEmpty,
    ucl: ucl,
    uclChaser: uclChaser,
    uclEmpty: uclEmpty,
    el: el,
    elChaser: elChaser,
    elEmpty: elEmpty,
    demotion: demotion,
    demotionEscape: demotionEscape,
    demotionEmpty: demotionEmpty,
  }
}
</script>

<template>
  <div
    class="title"
    :style="{
      '--primary': leagueTable.standings[0]?.tournament.uniqueTournament.primaryColorHex,
      '--secondary': leagueTable.standings[0]?.tournament.uniqueTournament.secondaryColorHex,
    }"
  >
    <h1>
      {{ leagueTable.standings[0]?.name }}
    </h1>
    <p>
      {{ leagueTable.standings[0]?.tournament.category.name }}
    </p>
  </div>
  <div class="container__checkboxes">
    <label>
      <input type="checkbox" v-model="isStatsOpen" />
      {{ `${isStatsOpen ? 'Close' : 'Open'} Point Tally` }}
    </label>
    <label>
      <input type="checkbox" v-model="isQualificationOpen" />
      {{ `${isQualificationOpen ? 'Close' : 'Open'} Qualification Tally` }}
    </label>
    <label>
      <input type="checkbox" v-model="isTimelinesOpen" />
      {{ `${isTimelinesOpen ? 'Close' : 'Open'} Timelines` }}
    </label>
    <select v-model="whichTimelineOpen" v-if="isTimelinesOpen">
      <option name="timeline" value="league">Title Race</option>
      <option name="timeline" value="ucl">UEFA Champions League Race</option>
      <option name="timeline" value="el">Europa League Race</option>
      <option name="timeline" value="rel">Relegation Battle</option>
    </select>
  </div>
  <hr />
  <div class="container__table">
    <table>
      <colgroup>
        <col span="3" />
      </colgroup>
      <colgroup class="colgroup__stats" :class="{ closed: !isStatsOpen }">
        <col span="6" />
      </colgroup>
      <colgroup class="colgroup__qualification" :class="{ closed: !isQualificationOpen }">
        <col span="9" />
      </colgroup>
      <colgroup
        class="colgroup__league"
        :class="{ closed: !isTimelinesOpen || whichTimelineOpen !== 'league' }"
      >
        <col :span="getRemainingMatches()" />
      </colgroup>
      <colgroup
        class="colgroup__cl"
        :class="{ closed: !isTimelinesOpen || whichTimelineOpen !== 'ucl' }"
      >
        <col :span="getRemainingMatches()" />
      </colgroup>
      <colgroup
        class="colgroup__europa"
        :class="{ closed: !isTimelinesOpen || whichTimelineOpen !== 'el' }"
      >
        <col :span="getRemainingMatches()" />
      </colgroup>
      <colgroup
        class="colgroup__relegation"
        :class="{ closed: !isTimelinesOpen || whichTimelineOpen !== 'rel' }"
      >
        <col :span="getRemainingMatches()" />
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
          <th id="header__ecl" :colspan="getRemainingMatches()">Relegation Timeline (Matchweek)</th>
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
          v-for="team in leagueTable.standings[0]?.rows"
          :key="team.id"
          :style="{
            '--primary-color': team.team.teamColors.primary,
            '--secondary-color': team.team.teamColors.secondary,
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
          <td
            :class="{
              promotion__cl: team.promotion?.id === 804,
              promotion__el: team.promotion?.id === 808,
              relegation: team.promotion?.id === 3,
            }"
          >
            {{ team.position }}
          </td>
          <td class="container__name">
            <span class="team__name">
              {{ team.team.name.toUpperCase() }}
            </span>
            <span class="team__name--spacer"> </span>
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
              getPoints(17) < getMaxPoints(team.position) && team.position > 17
                ? getPoints(17) - team.points
                : ''
            }}
          </td>
          <!-- Bar graphs for League Champ -->
          <td
            :class="['bar-graph', 'league-timeline', getLeagueRace(team).current.class]"
            :colspan="getLeagueRace(team).current.span"
            v-if="getLeagueRace(team).current.span !== 0"
            :style="`transition: transform ${1.5 * (getLeagueRace(team).current.span / getMinPlayed())}s linear`"
          >
            {{ getLeagueRace(team).current.value }}
          </td>

          <td
            :class="['bar-graph', 'league-timeline', getLeagueRace(team).champ.class]"
            :colspan="getLeagueRace(team).champ.span"
            v-if="getLeagueRace(team).champ.span !== 0"
            :style="`transition: transform ${1.5 * (getLeagueRace(team).champ.span / getMinPlayed())}s linear ${1.5 * (getLeagueRace(team).current.span / getMinPlayed())}s`"
          >
            {{ getLeagueRace(team).champ.value }}
          </td>

          <td
            :class="['bar-graph', 'league-timeline', getLeagueRace(team).eplChaser.class]"
            :colspan="getLeagueRace(team).eplChaser.span"
            v-if="getLeagueRace(team).eplChaser.span !== 0"
            :style="`transition: transform ${1.5 * (getLeagueRace(team).eplChaser.span / getMinPlayed())}s linear ${1.5 * (getLeagueRace(team).current.span / getMinPlayed())}s`"
          >
            {{ getLeagueRace(team).eplChaser.value }}
          </td>

          <td
            :class="['bar-graph', 'league-timeline', getLeagueRace(team).eplEmpty.class]"
            :colspan="getLeagueRace(team).eplEmpty.span"
            v-if="getLeagueRace(team).eplEmpty.span !== 0"
          ></td>

          <!-- Bargraphs for UCL -->

          <td
            :class="['bar-graph', 'ucl-timeline', getLeagueRace(team).current.class]"
            :colspan="getLeagueRace(team).current.span"
            v-if="getLeagueRace(team).current.span !== 0"
            :style="`transition: transform ${1.5 * (getLeagueRace(team).current.span / getMinPlayed())}s linear`"
          >
            {{ getLeagueRace(team).current.value }}
          </td>

          <td
            :class="['bar-graph', 'ucl-timeline', getLeagueRace(team).ucl.class]"
            :colspan="getLeagueRace(team).ucl.span"
            v-if="getLeagueRace(team).ucl.span !== 0"
            :style="`transition: transform ${1.5 * (getLeagueRace(team).ucl.span / getMinPlayed())}s linear ${1.5 * (getLeagueRace(team).current.span / getMinPlayed())}s`"
          >
            {{ getLeagueRace(team).ucl.value }}
          </td>

          <td
            :class="['bar-graph', 'ucl-timeline', getLeagueRace(team).uclChaser.class]"
            :colspan="getLeagueRace(team).uclChaser.span"
            v-if="getLeagueRace(team).uclChaser.span !== 0"
            :style="`transition: transform ${1.5 * (getLeagueRace(team).uclChaser.span / getMinPlayed())}s linear ${1.5 * (getLeagueRace(team).current.span / getMinPlayed())}s`"
          >
            {{ getLeagueRace(team).uclChaser.value }}
          </td>

          <td
            :class="['bar-graph', getLeagueRace(team).uclEmpty.class]"
            :colspan="getLeagueRace(team).uclEmpty.span"
            v-if="getLeagueRace(team).uclEmpty.span !== 0"
          ></td>

          <!-- Bargraphs for EUL -->

          <td
            :class="['bar-graph', 'europa-timeline', getLeagueRace(team).current.class]"
            :colspan="getLeagueRace(team).current.span"
            v-if="getLeagueRace(team).current.span !== 0"
            :style="`transition: transform ${1.5 * (getLeagueRace(team).current.span / getMinPlayed())}s linear`"
          >
            {{ getLeagueRace(team).current.value }}
          </td>

          <td
            :class="['bar-graph', 'europa-timeline', getLeagueRace(team).el.class]"
            :colspan="getLeagueRace(team).el.span"
            v-if="getLeagueRace(team).el.span !== 0"
            :style="`transition: transform ${1.5 * (getLeagueRace(team).el.span / getMinPlayed())}s linear ${1.5 * (getLeagueRace(team).current.span / getMinPlayed())}s`"
          >
            {{ getLeagueRace(team).el.value }}
          </td>

          <td
            :class="['bar-graph', 'europa-timeline', getLeagueRace(team).elChaser.class]"
            :colspan="getLeagueRace(team).elChaser.span"
            v-if="getLeagueRace(team).elChaser.span !== 0"
            :style="`transition: transform ${1.5 * (getLeagueRace(team).elChaser.span / getMinPlayed())}s linear ${1.5 * (getLeagueRace(team).current.span / getMinPlayed())}s`"
          >
            {{ getLeagueRace(team).elChaser.value }}
          </td>

          <td
            :class="['bar-graph', getLeagueRace(team).elEmpty.class]"
            :colspan="getLeagueRace(team).elEmpty.span"
            v-if="getLeagueRace(team).elEmpty.span !== 0"
          ></td>

          <!-- Bargraphs for Relegation -->

          <td
            :class="['bar-graph', 'relegation-timeline', getLeagueRace(team).current.class]"
            :colspan="getLeagueRace(team).current.span"
            v-if="getLeagueRace(team).current.span !== 0"
            :style="`transition: transform ${1.5 * (getLeagueRace(team).current.span / getMinPlayed())}s linear`"
          >
            {{ getLeagueRace(team).current.value }}
          </td>

          <td
            :class="['bar-graph', 'relegation-timeline', getLeagueRace(team).demotion.class]"
            :colspan="getLeagueRace(team).demotion.span"
            v-if="getLeagueRace(team).demotion.span !== 0"
            :style="`transition: transform ${1.5 * (getLeagueRace(team).demotion.span / getMinPlayed())}s linear ${1.5 * (getLeagueRace(team).current.span / getMinPlayed())}s`"
          >
            {{ getLeagueRace(team).demotion.value }}
          </td>

          <td
            :class="['bar-graph', 'relegation-timeline', getLeagueRace(team).demotionEscape.class]"
            :colspan="getLeagueRace(team).demotionEscape.span"
            v-if="getLeagueRace(team).demotionEscape.span !== 0"
            :style="`transition: transform ${1.5 * (getLeagueRace(team).demotionEscape.span / getMinPlayed())}s linear ${1.5 * (getLeagueRace(team).current.span / getMinPlayed())}s`"
          >
            {{ getLeagueRace(team).demotionEscape.value }}
          </td>

          <td
            :class="['bar-graph', getLeagueRace(team).demotionEmpty.class]"
            :colspan="getLeagueRace(team).demotionEmpty.span"
            v-if="getLeagueRace(team).demotionEmpty.span !== 0"
          ></td>
        </tr>
      </tbody>
    </table>
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
  color: var(--text);

  padding-top: 8px;
  padding-bottom: 16px;
  padding-inline: 2em;
}

.title h1 {
  font-style: italic;
  font-weight: 900;
  font-size: 3rem;
}

.title p {
  font-size: 1.5rem;
}

.container__checkboxes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);

  margin: 2em;

  position: sticky;
  top: 0;
  z-index: 99;

  background-color: rgb(245, 245, 245);

  padding-top: 1em;
  padding-bottom: 1em;
}

.container__table {
  width: calc(100dvw - 5em);
  overflow-y: auto;
  margin-inline: 2em;
}

table {
  border-collapse: collapse;
}

th {
  vertical-align: bottom;

  background-color: rgb(245, 245, 245);
}

td {
  background-color: rgb(245, 245, 245);
  text-align: center;

  min-width: 2em;
  padding: 0.5em;
}

.col__team-position {
  position: sticky;
  left: 0;
}

th:nth-child(1),
td:nth-child(1) {
  min-width: 2em;
  padding: 0;
  position: sticky;
  left: 0;
}

.col__team-position1,
.col__team-position2,
td:nth-child(2) {
  min-width: 100%;
  padding: 0;

  position: sticky;
  left: calc(2em + 1px);
}

.container__name {
  text-align: start;

  display: grid;
  grid-template-columns: 15em 10em;
}

.team__name,
.team__name--spacer {
  padding-top: 0.5em;
  padding-bottom: 0.5em;
}

.team__name {
  padding-left: 0.5em;
}

.team__code {
  position: sticky;
  left: calc(27em + 1px);
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

.team__name--spacer {
  background-image: linear-gradient(
    135deg,
    var(--primary-color) 70%,
    var(--secondary-color) 70%,
    var(--primary-color) 75%,
    var(--primary-color) 75%,
    var(--secondary-color) 75%,
    var(--primary-color) 80%,
    var(--primary-color) 80%,
    var(--secondary-color) 80%
  );
}

.container__name span {
  white-space: nowrap;
}

.team__name {
  background-color: var(--primary-color);

  color: var(--primary-text-color);
}

.team__code {
  background-color: var(--secondary-color);
  color: var(--secondary-text-color);
}

.promotion__cl {
  --color: blue;
  color: white;
  background-color: var(--color);
}

.promotion__el {
  --color: orange;
  color: white;
  background-color: var(--color);
}

.relegation {
  --color: red;
  color: white;
  background-color: var(--color);
}

.toPlayFor {
  text-decoration: underline;
}

td {
  transform-origin: left;
}

.bar-graph {
  text-align: end;
}

.matchweek {
  padding-inline: 4px;
}

.current-points {
  background-color: var(--primary-color);
  color: var(--primary-text-color);
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

tr .stats:nth-child(even) {
  background-color: rgb(232, 232, 240);
}

@media (max-width: 50em) {
  .team__name,
  .team__name--spacer {
    visibility: collapse;
  }

  th:nth-child(2),
  td:nth-child(2) {
    min-width: 0;
    width: 0;
  }

  th:nth-child(3),
  td:nth-child(3) {
    left: calc(2em + 1px);

    min-width: 100%;
  }
}

@media (max-width: 43.75em) {
  .container__checkboxes {
    grid-template-columns: repeat(1, 1fr);
  }

  td {
    min-width: 1em;
    padding: 0.1em;
  }
}
</style>
