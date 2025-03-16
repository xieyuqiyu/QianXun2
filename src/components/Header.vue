<!-- vue3 模板 -->

<template>
    <header class="logo">
        <div>

            <span class="nav">Navbar+</span>
        </div>

        <div class="temperature">
            <span style="display: flex;justify-content: center;align-items: center;">
                <img :src="templete" />
            </span>

            <span class="temperature1">
                <!-- 获取当前地区的温度 -->
                <span v-text="temperature"></span>
            </span>
            <span class="temperature2">
                <!-- 获取当前的时间 只需要时分 -->
                <span v-text="new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })"></span>
            </span>



        </div>
    </header>

</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import templete from '../assets/templete.svg'

const temperature = ref('加载中...')
const currentTime = ref(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))

const updateTime = () => {
    currentTime.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
    try {
        const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=YOUR_CITY&appid=YOUR_API_KEY&units=metric')
        const data = await response.json()
        temperature.value = `${data.main.temp}°C`
    } catch (error) {
        temperature.value = '无法获取温度'
    }

    const interval = setInterval(updateTime, 60000) // 每分钟更新一次时间
    onUnmounted(() => clearInterval(interval))
})
</script>

<style scoped>
.logo {
    /* width 自适应 */
    width: calc(100% - 4rem);
    height: 5.25rem;
    padding: 2rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav {
    color: #FFFFFF;
    font-family: "Inter";
    font-size: 1.88rem;
    font-style: normal;
    font-weight: 400;
    line-height: 2.2rem;
    /* 1.2 */

}

.temperature {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
}

.temperature1 {

    color: #FFFFFF;
    font-family: "Inter";
    font-size: 1rem;
    font-style: normal;
    font-weight: 500;
    line-height: 1.5rem;
    /* 1.5 */


}

.temperature2 {

    color: #FFFFFF;
    font-family: "HarmonyOS Sans SC";
    font-size: 1.5rem;
    font-style: normal;
    font-weight: 500;
    line-height: 2rem;
    /* 1.333 */

    /* 1.333 */

}
</style>
