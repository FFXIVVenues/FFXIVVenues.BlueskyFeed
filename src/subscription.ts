import { OutputSchema as RepoEvent, isCommit } from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'
import { tags } from './tags'
import { handles } from './handles'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt);
    const taggedCreates = ops.posts.creates.filter(c =>
      tags.some(t => c.record.text.includes(t)) || handles.includes(c.author));

    for (const post of taggedCreates) {
      console.log(post.record.text);
      console.log(post.author);
      console.log("\n");
    }

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = taggedCreates.map(c => ({
        uri: c.uri,
        cid: c.cid,
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
