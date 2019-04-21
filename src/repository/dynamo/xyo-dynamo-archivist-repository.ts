/*
 * File: xyo-dynamo-archivist-repository.ts
 * Project: sdk-archivist-nodejs
 * File Created: Tuesday, 16th April 2019 2:04:07 pm
 * Author: XYO Development Team (support@xyo.network)
 * -----
 * Last Modified: Thursday, 18th April 2019 9:50:38 am
 * Modified By: XYO Development Team (support@xyo.network>)
 * -----
 * Copyright 2017 - 2019 XY - The Persistent Company
 */

import {
  IXyoArchivistRepository,
  IXyoOriginBlocksByPublicKeyResult,
  IXyoEntitiesList,
  IXyoIntersectionsList
} from '..'

import { XyoBase } from '@xyo-network/base'
import { IXyoPublicKey, IXyoSignature } from '@xyo-network/signing'
import { IXyoBoundWitness } from '@xyo-network/bound-witness'
import { IXyoSerializationService, IXyoSerializableObject } from '@xyo-network/serialization'

import _ from 'lodash'
import { DynamoDB } from 'aws-sdk'
import { IXyoHash } from '@xyo-network/hashing'
import { IOriginBlockQueryResult } from '@xyo-network/origin-block-repository'

export class XyoArchivistDynamoRepository extends XyoBase implements IXyoArchivistRepository {

  private dynamodb: DynamoDB
  private tableInfo: any

  constructor(
    private readonly serializationService: IXyoSerializationService,
    private readonly tableName: string
  ) {
    super()
    this.dynamodb = new DynamoDB()
  }

  public async getOriginBlocksByPublicKey(publicKey: IXyoPublicKey): Promise<IXyoOriginBlocksByPublicKeyResult> {
    return {
      publicKeys: [],
      boundWitnesses: []
    }
  }

  public async getIntersections(
    publicKeyA: string,
    publicKeyB: string,
    limit: number,
    cursor: string | undefined
  ): Promise<IXyoIntersectionsList> {
    return {
      list: [],
      hasNextPage: false,
      totalSize: 0,
      cursor: undefined
    }
  }

  public async getEntities(limit: number, offsetCursor?: string | undefined): Promise<IXyoEntitiesList> {
    return {
      list: [],
      hasNextPage: false,
      totalSize: 0,
      cursor: undefined
    }
  }

  public async removeOriginBlock(hash: Buffer): Promise<void> {
    return
  }

  public async containsOriginBlock(hash: Buffer): Promise<boolean> {
    return false
  }

  public async getAllOriginBlockHashes(): Promise<Buffer[]> {
    return []
  }

  public async addOriginBlock(
    hash: IXyoHash,
    originBlock: IXyoBoundWitness,
    bridgedFromOriginBlockHash?: IXyoHash
  ): Promise<void> {
    return
  }

  public async getOriginBlockByHash(hash: Buffer): Promise<IXyoBoundWitness | undefined> {
    return undefined
  }

  public async getBlocksThatProviderAttribution(hash: Buffer): Promise<{[h: string]: IXyoBoundWitness}> {
    return {

    }
  }

  public async getOriginBlocks(limit: number, offsetHash?: Buffer | undefined): Promise<IOriginBlockQueryResult> {
    return {
      list: [],
      hasNextPage: false,
      totalSize: 0
    }
  }

  private async getTableInfo() {
    if (!this.tableInfo) {
      this.tableInfo = await this.createTableIfNeeded()
    }
    return this.tableInfo
  }

  private async createTable(tableName: string) {
    return new Promise((resolve, reject) => {
      const createParams = {
        AttributeDefinitions: [
          {
            AttributeName: 'Hash',
            AttributeType: 'S'
          },
          {
            AttributeName: 'Data',
            AttributeType: 'B'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'Hash',
            KeyType: 'HASH'
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        },
        TableName: tableName
      }
      this.dynamodb.createTable(createParams, (createErr, tableData) => {
        if (createErr) {
          reject(createErr)
          return
        }
        resolve(tableData)
      })
    })
  }

  private async readTableDescription(tableName: string) {
    return new Promise((resolve, reject) => {
      this.dynamodb.describeTable({ TableName: tableName }, ((describeErr, describeData) => {
        if (describeErr) {
          reject(describeErr)
          return
        }
        resolve(describeData)
      }))
    })
  }

  private async createTableIfNeeded() {
    return new Promise((resolve, reject) => {
      this.dynamodb.listTables(async (listErr, listData) => {
        if (listErr) {
          reject(listErr)
          return
        }
        let found = false
        if (listData.TableNames) {
          for (const table of listData.TableNames) {
            if (table === this.tableName) {
              found = true
            }
          }
        }
        if (!found) {
          resolve(await this.createTable(this.tableName))
        } else {
          resolve(await this.readTableDescription(this.tableName))
        }
      })
    })
  }
}
