<template>
    <a-row>
        <a-button v-if="videoData.length > 1" @click="mergeVideo(videoData)" type="default" style="margin-bottom: 10px">合并文件</a-button>
    </a-row>
    <a-row>
        <a-table :columns="columns" :data-source="videoData">
            <template v-slot:action="{record}">
                <span>
                    <a @click="deleteFile(record.videoName)">删除</a>
                    <a-divider type="vertical"/>
                    <a v-if="record.type === 'audio'" @click="transferToMp3(record.videoName)">转成mp3</a>
                    <a v-else-if="record.type === 'mix'" @click="transferToMp3(record.videoName)">分离mp3</a>
                </span>
            </template>
        </a-table>
    </a-row>
</template>
<script>
import {deleteFile, transferVideoToMp3, mergeDownloadFiles} from '../render'
export default {
    name: 'ToutiaoVideoKitchen',
    props: {
        videoFileNames: Array,
        type: String
    },
    data() {
        return {
            columns: [
                {
                    dataIndex: "videoName",
                    title: "视频名称",
                    width:500,
                },
                {
                    key: "action",
                    width:200,
                    slots: {
                        customRender: 'action'
                    },
                }],
            videoData: []
        }
    },
    unmounted() {
        this.videoData = []
    },
    mounted() {
        this.videoData = this.videoFileNames.map(({fileName, type}, idx) => {
            return {
                key: idx,
                videoName: fileName,
                type
            }
        })
    },
    methods: {
        async workWithModal(beforeMessage, callback, afterMessage, failMessage) {
            const modal = this.$info({
                title:"系统消息",
                content:beforeMessage,
                okButtonProps: {
                    disabled: true
                },
                cancelButtonProps: {
                    disabled: true
                }
            })
            try {
                await callback()
            } catch (err) {
                console.error(err)
                modal.update({
                    content:failMessage ? failMessage : "系统异常",
                    okButtonProps: {
                        disabled: false
                    },
                    cancelButtonProps: {
                        disabled: false
                    }
                })
                return
            }
            modal.update({
                content:afterMessage,
                okButtonProps: {
                    disabled: false
                },
                cancelButtonProps: {
                    disabled: false
                }
            })
        },
        async transferToMp3(fileName) {
            console.log(fileName)
            await this.workWithModal("转换文件格式中，请稍后...", (() => {
                return async ()=> await transferVideoToMp3(fileName)
            })(), "转换完成")
        },
        async mergeVideo(videoFileList) {
            if (videoFileList.length > 2) {
                return
            }
            await this.workWithModal("合并文件中，请稍后...", (() => {
                return async () => await mergeDownloadFiles(videoFileList[0].videoName, videoFileList[1].videoName)
            })(), "合并文件完成")
        },
        async deleteFile(fileName) {
            await this.workWithModal("删除中，请稍后", (() => {
                return async () => {
                    await deleteFile(fileName)

                }
            })(), "删除完成")
            this.videoData = this.videoData.filter(({videoName}) => videoName !== fileName)
        }
    },
    watch:{
        videoFileNames(cur, old) {
            this.videoData = cur.map(({fileName, type}, idx) => {
                return {
                    key: idx,
                    videoName: fileName,
                    type
                }
            })
        }
    }
}
</script>