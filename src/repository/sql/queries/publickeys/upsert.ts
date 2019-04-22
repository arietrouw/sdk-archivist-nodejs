/*
 * File: upsert.ts
 * Project: sdk-archivist-nodejs
 * File Created: Tuesday, 16th April 2019 9:19:00 am
 * Author: XYO Development Team (support@xyo.network)
 * -----
 * Last Modified: Thursday, 18th April 2019 9:49:40 am
 * Modified By: XYO Development Team (support@xyo.network>)
 * -----
 * Copyright 2017 - 2019 XY - The Persistent Company
 */

import { SqlQuery } from '../query'
import { SqlService } from '../../sql-service'
import { IXyoSerializationService } from '@xyo-network/serialization'
import _ from 'lodash'
import { IXyoPublicKey } from '@xyo-network/signing'
import { RelinkPublicKeysQuery } from './relinkall'
import { InsertPublicKeysQuery } from './insert'
import { SelectPublicKeyGroupsByKeyQuery, DeletePublicKeyGroupQuery } from '../publickeygroups'

export class UpsertPublicKeysQuery extends SqlQuery {

  constructor(sql: SqlService, serialization: IXyoSerializationService) {
    super(sql, '', // this is a meta query, so no sql
          serialization)
  }

  public async send(
    { key,
      publicKeyGroupId }: {
        key: IXyoPublicKey | string,
        publicKeyGroupId: number}
  ) {
    const hexKey = typeof key === 'string' ? key : key.serializeHex()

    const publicKeyMatches = await new SelectPublicKeyGroupsByKeyQuery(this.sql, this.serialization).send(
      { hexKey }
    )

    const publicKey = _.chain(publicKeyMatches).first().value()
    if (publicKey) {
      if (publicKey.publicKeyGroupId === publicKeyGroupId) {
        return publicKey.id
      }

      // Self heal out of turn blocks
      await new RelinkPublicKeysQuery(this.sql, this.serialization).send(
        { publicKeyGroupIdNew: publicKeyGroupId,
          publicKeyGroupIdOld: publicKey.publicKeyGroupId
        }
      )

      await new DeletePublicKeyGroupQuery(this.sql, this.serialization).send(
        { publicKeyGroupId: publicKey.publicKeyGroupId }
      )

      return publicKey.id
    }

    return new InsertPublicKeysQuery(this.sql, this.serialization).send(
      { hexKey, publicKeyGroupId }
    )
  }
}
