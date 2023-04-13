<template>
    <a-modal v-model:visible="kitchenModalVisible" :mask-closable="false" title="视频已下载完成" ok-text="确认"
             cancel-text="取消" @ok="hideKitchenModal">
        <toutiao-video-kitchen :video-file-names="fileNameList"></toutiao-video-kitchen>
    </a-modal>
    <a-modal v-model:visible="configModalVisible" :maskClosable="false" title="下载工具基础设置" ok-text="确认"
             cancel-text="取消" @ok="hideLightConfigModal">
        <toutiao-video-config></toutiao-video-config>
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
            <a-row style="padding: 10px 10px" v-if="isVip">
                <a-col :span="3"></a-col>
                <a-col :span="18">
                    <a-input-group compact>
                        <a-input v-model:value="vipFileName" style="width: calc(100% - 200px)"/>
                        <a-button type="primary" @click="probeVideoFormat">探测文件类型</a-button>
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
    downloadVideoByPcUrl,
    isToutiaoUrl,
    explainDownloadError, readAppConfig, probeVideoFile, checkAppConfig
} from '../render'
import ToutiaoVideoConfig from "./ToutiaoVideoConfig.vue";
import ToutiaoVideoKitchen from "./ToutiaoVidoKitchen.vue";

export default {
    name: "Toutiao",
    components: {
        ToutiaoVideoKitchen,
        ToutiaoVideoConfig,
        SettingOutlined
    },
    data() {
        return {
            videoUrl: "",
            configModalVisible: false,
            kitchenModalVisible: false,
            fileNameList: [],
            isVip: false,
            vipFileName: '',
        }
    },
    methods: {
        async showLightConfigModal() {
            this.configModalVisible = true
        },
        showKitchenModal(props) {
            this.fileNameList = props
            this.kitchenModalVisible = true
        },
        hideLightConfigModal() {
            this.configModalVisible = false
        },
        hideKitchenModal() {
            this.kitchenModalVisible = false
            this.fileNameList = []
        },
        showConvert(singleMediaFile) {
            const modal = this.$success({
                title: "系统消息",
                content: h('div', [h('span', singleMediaFile['fileName'])]),
                onOk:() => {
                    this.showKitchenModal([singleMediaFile])
                }
            })
        },
        async showOptionsAfterDownload(m1, m2) {
            this.$success({
                title: "系统消息-下载完成",
                content: h('div', [h('div', m1['fileName']), h('div', m2['fileName'])]),
                onOk:() => {
                    this.showKitchenModal([m1, m2])
                }
            })

        },
        async downloadVideo() {
            if (this.videoUrl === 'I am Vip') {
                this.isVip = true
            }
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
                    title: "系统消息",
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
                if (!files || files.length === 0) {
                    throw Error("fail downlaod")
                }
                if (files.length === 1) {
                    await this.showConvert({fileName: files[0], type: await this.probeVideoFormat(files[0])})
                } else {
                    await this.showOptionsAfterDownload({
                            fileName: files[0],
                            type: await this.probeVideoFormat(files[0])
                        },
                        {
                            fileName: files[1],
                            type: await this.probeVideoFormat(files[1])
                        })
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
        async probeVideoFormat(fileName) {
            return await probeVideoFile(fileName)
        }
    }
}
</script>

<style scoped>
.toutiao-title {
    background: white;
    padding: 10% 10%;
}

.content {
    padding: 10px 10px;
    background: white;
    height: 80%;
}
</style>