<template>
  <div>
      {{message}}
  </div>
  <button>点击</button>
</template>

<script>
export default {
    name: "Toutiao",
    data() {
        return {
            message:"I love you"
        }
    },
    mounted() {
      console.log('I love u')
    }
}
</script>

<style scoped>

</style>