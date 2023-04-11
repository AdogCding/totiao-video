<template>
    <a-modal v-model:visible="modalVisible" :maskClosable="false" title="下载工具基础设置" ok-text="确认"
             cancel-text="取消" @ok="hideLightConfigModal">
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
    </a-modal>
    <a-layout style="background: white">
        <a-row>
            <a-col :span="22"></a-col>
            <a-col :span="2">
                <div @click="showLightConfigModal">
                    <setting-outlined/>
                </div>
            </a-col>
        </a-row>
    </a-layout>
    <a-layout>
        <a-layout-header class="toutiao-title">
            <a-row>
                <a-col :span="3"></a-col>
                <a-col :span="18">
                    <h1>今日头条视频下载器</h1>
                </a-col>
                <a-col :span="3">
                </a-col>
            </a-row>
        </a-layout-header>
        <a-layout-content class="content">
            <a-row>
                <a-col :span="3"></a-col>
                <a-col :span="18">
                    <a-input-group compact>
                        <a-input v-model:value="videoUrl" style="width: calc(100% - 200px)"/>
                        <a-button type="primary" @click="downloadVideo">下载</a-button>
                    </a-input-group>
                </a-col>
                <a-col :span="3"></a-col>
            </a-row>
        </a-layout-content>
    </a-layout>
</template>

<script>
import {SettingOutlined} from '@ant-design/icons-vue'
import {h} from 'vue'
import {
    chooseDirectory,
    downloadVideoByPcUrl,
    isToutiaoUrl,
    changeVideoDownloadDirectory,
    explainDownloadError, readAppConfig, probeVideoFile, chooseFile,checkAppConfig
} from '../render'

export default {
    name: "Toutiao",
    components: {
        SettingOutlined
    },
    data() {
        return {
            videoUrl: "",
            downloadDirectory: "",
            ffmpegLocation:"",
            ffprobeLocation:"",
            modalVisible: false,
        }
    },
    methods: {
        async showLightConfigModal() {
            const modal = this.$info({
                title: "系统消息",
                content: "正在打开设置...",
                okButtonProps: {
                    disabled: true
                },
                cancelButtonProps: {
                    disabled: true
                }
            })
            try {
                const config = await readAppConfig()
                this.downloadDirectory = config.videoLocation
                this.ffprobeLocation = config.ffprobeLocation
                this.ffmpegLocation = config.ffmpegLocation
            } catch (err) {
                console.error(err)
                modal.update({
                    content: "打开错误",
                    okButtonProps: {
                        disabled: false
                    },
                    cancelButtonProps: {
                        disabled: false
                    }
                })
                return
            }
            modal.destroy()
            this.modalVisible = true
        },
        hideLightConfigModal() {
            this.modalVisible = false
        },
        showConvert(singleMediaFile) {
            const modal = this.$success({
                title:"系统消息",
                content:h('div', [h('span', singleMediaFile)])
            })
        },
        async showOptionsAfterDownload(m1, m2) {
            this.$success({
                title:"系统消息-下载完成",
                content:h('div', [h('div', m1), h('div', m2)])
            })
            this.probeVideoFormat(m1)
        },
        async downloadVideo() {
            if (!isToutiaoUrl(this.videoUrl)) {
                this.$info({
                    title: '系统消息',
                    content: "视频地址不正确"
                })
                return
            }
            const [isAppConfigAppropriate, message] = await checkAppConfig()
            if (!isAppConfigAppropriate) {
                this.$warning({
                    title:"系统消息",
                    content: `${message}配置不正确`
                })
                return
            }
            const modal = this.$info({
                title: '系统消息',
                content: "下载中,请稍后...",
                okButtonProps: {
                    disabled: true
                },
                cancelButtonProps: {
                    disabled: true
                }
            })
            try {
                const files = await downloadVideoByPcUrl(this.videoUrl)
                modal.destroy()
                if (files.length === 1) {
                    this.showConvert(files[0])
                } else {
                    await this.showOptionsAfterDownload(files[0], files[1])
                }
            } catch (err) {
                modal.update({
                    content: `下载失败, ${explainDownloadError(err)}`,
                    okButtonProps: {
                        disabled: false
                    },
                    cancelButtonProps: {
                        disabled: false
                    }
                })
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
            this.ffmpegLocation = await chooseFile('ffprobe')
        },
        async probeVideoFormat(fileName) {
            const videoMeta = await probeVideoFile(fileName)
            return videoMeta["streams"]?.map(stream => {
                return {
                    "type":stream["codec_type"]
                }
            })
        }
    }
}
</script>

<style scoped>
.toutiao-title {
    background: white;
    padding: 10% 10%;
}
.row-gap {
    padding: 10px 10px;
}
.content {
    padding: 10px 10px;
    background: white;
    height: 80%;
}
</style>