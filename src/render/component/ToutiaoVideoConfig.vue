<template>
    <a-spin :spinning="spanning">
        <a-row class="row-gap">
            <a-input-group>
                <a-space>
                    <a-input addon-before="下载目录" :readOnly="true" v-model:value="downloadDirectory"/>
                    <a-button type="primary" @click="chooseDirectory">选择目录</a-button>
                    <a-button type="primary" @click="confirmDirectory">确认目录是否可用</a-button>
                </a-space>
            </a-input-group>
        </a-row>
        <a-row class="row-gap">
            <a-input-group>
                <a-space>
                    <a-input addon-before="ffmpeg位置" :readOnly="true" v-model:value="ffmpegLocation"/>
                    <a-button type="primary" @click="chooseFfmpegExe">选择文件</a-button>
                </a-space>
            </a-input-group>
        </a-row>
        <a-row class="row-gap">
            <a-input-group>
                <a-space>
                    <a-input addon-before="ffmprobe位置" :readOnly="true" v-model:value="ffprobeLocation"/>
                    <a-button type="primary" @click="chooseFfprobeExe">选择文件</a-button>
                </a-space>
            </a-input-group>
        </a-row>
    </a-spin>

</template>

<script>
import {changeVideoDownloadDirectory, chooseDirectory, chooseFile, readAppConfig} from "../render";

export default {
    name: "ToutiaoVideoConfig",
    data() {
        return {
            downloadDirectory: "",
            ffmpegLocation:"",
            ffprobeLocation:"",
            spanning:false
        }
    },
    mounted() {
        this.readConfig()
    },
    methods: {
        async readConfig() {
            this.spanning = true
            try {
                const config = await readAppConfig()
                this.downloadDirectory = config.videoLocation
                this.ffprobeLocation = config.ffprobeLocation
                this.ffmpegLocation = config.ffmpegLocation
            } catch (err) {
                console.error(err)
                this.$warning({
                    title:"系统信息",
                    content: "打开错误",
                })

            } finally {
                this.spanning = false
            }
        },
        async chooseDirectory() {
            this.downloadDirectory = await chooseDirectory()
        },
        confirmDirectory() {
            changeVideoDownloadDirectory(this.downloadDirectory)
        },
        async chooseFfmpegExe() {
            this.ffmpegLocation = await chooseFile('ffmpeg')
        },
        async chooseFfprobeExe() {
            this.ffprobeLocation = await chooseFile('ffprobe')
        },
    }
}
</script>

<style scoped>
.row-gap {
    padding: 10px 10px;
}
</style>