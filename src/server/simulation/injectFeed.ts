import type { createScamSession } from "../../runtime/createScamSession"
import type { ScenarioFeedItem } from "../../shared/types"

type LiveSession = ReturnType<typeof createScamSession>

export function injectScenarioFeed(session: LiveSession, feed: ScenarioFeedItem) {
	switch (feed.sourceChannel) {
		case "call":
			session.injectCall(feed.payload)
			return
		case "message":
			session.injectMessage(feed.payload)
			return
		case "browser":
			session.injectBrowser(feed.payload)
			return
		case "identity":
			session.injectIdentity(feed.payload)
			return
		case "device":
			session.injectDevice(feed.payload)
			return
		case "transaction":
			session.injectTransaction(feed.payload)
			return
	}
}
