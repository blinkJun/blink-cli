'use strict';
const axios = require('axios')
const urlJoin = require('url-join')
const semver = require('semver')

const defaultRegistry = 'https://registry.npmjs.org'
const taobaoRegistry = 'https://registry.npm.taobao.org'

// 获取默认的源
const getDefaultRegistry = function(origin=true){
    return origin?defaultRegistry:taobaoRegistry
}

// 获取npm包的详细信息
function getNpmInfo(npmName,registry=defaultRegistry) {
    if(!npmName){
        return null
    }
    const pkgUrl = urlJoin(registry,npmName)
    return axios.get(pkgUrl).then((response)=>{
        if(response.status===200){
            return response.data
        }else{
            return null
        }
    }).catch((err)=>{
        return Promise.reject(err)
    })
}

// 获取npm包的版本号列表
async function getNpmVersions(npmName,registry){
    const npmInfo = await getNpmInfo(npmName,registry)
    if(npmInfo){
        return Object.keys(npmInfo.versions)
    }else{
        return []
    }
}

// 获取大于基准版本的版本号列表
async function getNpmGtVersions(npmName,baseVersion){
    const versions = await getNpmVersions(npmName)
    const sortVersions =  versions.sort((a,b)=>{
        return semver.gt(a,b)?-1:1
    })
    if(baseVersion){
        return sortVersions.filter(version=>{
            return semver.gte(version,baseVersion)
        })
    }else{
        return sortVersions
    }
}

// 获取最新的版本号
async function getNpmLatestVersion(npmName,baseVersion){
    const gtVersions = await getNpmGtVersions(npmName,baseVersion)
    if(gtVersions.length>0){
        return gtVersions[0]
    }else{
        return baseVersion
    }
}

module.exports = {
    getNpmInfo,
    getNpmVersions,
    getNpmGtVersions,
    getNpmLatestVersion,
    getDefaultRegistry
};