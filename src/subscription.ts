import { OutputSchema as RepoEvent, isCommit } from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)
    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) =>
        create.record.tags?.some((tag) =>
          tag === 'ffxivvenues' || tag === 'ffxivvenue' ||
          tag === 'xivvenues' || tag == 'xivvenue' ||
          tag === 'ffxivclubbing' || tag === 'ffxivclub' ||
          tag === 'ffxivparty' || 'ffxivnightlife'))
      .map((create) => ({
          uri: create.uri,
          cid: create.cid,
          indexedAt: new Date().toISOString(),
        }));

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}
