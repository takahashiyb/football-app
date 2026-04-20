<script lang="ts" setup></script>

<template>
  <ul>
    <li>
      <RouterLink :to="{ name: 'league', query: { league: 'premier-league' } }">
        Premier League
      </RouterLink>
    </li>
    <li>
      <RouterLink :to="{ name: 'league', query: { league: 'la-liga' } }"> La Liga </RouterLink>
    </li>
    <li>
      <RouterLink :to="{ name: 'league', query: { league: 'bundesliga' } }">Bundesliga</RouterLink>
    </li>
    <li>
      <RouterLink :to="{ name: 'league', query: { league: 'ligue-1' } }">Ligue 1</RouterLink>
    </li>
    <li>
      <RouterLink :to="{ name: 'league', query: { league: 'seria-a' } }">Serie A</RouterLink>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
ul {
  list-style-type: none;
}
</style>
