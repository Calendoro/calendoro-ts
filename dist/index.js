// packages/sdk/src/errors.ts
/** Base of everything this SDK throws. */
var CalendoroError = class extends Error {
	/** The `x-request-id` of the failed response. Quote it in support requests. */
	requestId;
	constructor(message, requestId, options) {
		super(message, options);
		this.name = new.target.name;
		this.requestId = requestId;
	}
};
/** The API answered with an error status. `code` is stable; branch on it, not on the message. New codes can appear, so keep a default branch. */
var ApiError = class extends CalendoroError {
	status;
	code;
	details;
	constructor(status, code, message, details, requestId) {
		super(message, requestId);
		this.status = status;
		this.code = code;
		this.details = details;
	}
};
var ValidationError = class extends ApiError {};
var AuthenticationError = class extends ApiError {};
var PermissionError = class extends ApiError {};
var NotFoundError = class extends ApiError {};
var ConflictError = class extends ApiError {};
var ServerError = class extends ApiError {};
var RateLimitError = class extends ApiError {
	/** Seconds the server asked to wait, when it said. */
	retryAfter;
	constructor(status, code, message, details, requestId, retryAfter) {
		super(status, code, message, details, requestId);
		this.retryAfter = retryAfter;
	}
};
/** The request never got an answer: DNS, connection or an aborted fetch. */
var NetworkError = class extends CalendoroError {};
/** No answer within `timeoutMs`. */
var TimeoutError = class extends NetworkError {};
/** `validateResponse` rejected a response. Only happens if you opt in to it. */
var ResponseValidationError = class extends CalendoroError {};
function apiErrorFor(status, code, message, details, requestId, retryAfter) {
	if (status === 429) return new RateLimitError(status, code, message, details, requestId, retryAfter);
	return new (status === 400 || status === 422 ? ValidationError : status === 401 ? AuthenticationError : status === 403 ? PermissionError : status === 404 ? NotFoundError : status === 409 ? ConflictError : status >= 500 ? ServerError : ApiError)(status, code, message, details, requestId);
}
// packages/sdk/src/route-table.ts
var routeTable = {
	"signup": [
		"POST",
		"/v1/auth/signup",
		false
	],
	"login": [
		"POST",
		"/v1/auth/login",
		false
	],
	"logout": [
		"POST",
		"/v1/auth/logout",
		true
	],
	"getMe": [
		"GET",
		"/v1/users/me",
		false
	],
	"updateMe": [
		"PATCH",
		"/v1/users/me",
		false
	],
	"getApiIdentity": [
		"GET",
		"/v1/me",
		false
	],
	"listEventTypes": [
		"GET",
		"/v1/event-types",
		false
	],
	"createEventType": [
		"POST",
		"/v1/event-types",
		true
	],
	"getEventType": [
		"GET",
		"/v1/event-types/:id",
		false
	],
	"updateEventType": [
		"PATCH",
		"/v1/event-types/:id",
		false
	],
	"deleteEventType": [
		"DELETE",
		"/v1/event-types/:id",
		false
	],
	"getSchedule": [
		"GET",
		"/v1/availability/schedule",
		false
	],
	"putSchedule": [
		"PUT",
		"/v1/availability/schedule",
		false
	],
	"getSlots": [
		"GET",
		"/v1/availability/slots",
		false
	],
	"listBookings": [
		"GET",
		"/v1/bookings",
		false
	],
	"createBooking": [
		"POST",
		"/v1/bookings",
		true
	],
	"getBooking": [
		"GET",
		"/v1/bookings/:id",
		false
	],
	"rescheduleBooking": [
		"POST",
		"/v1/bookings/:id/reschedule",
		true
	],
	"cancelBooking": [
		"POST",
		"/v1/bookings/:id/cancel",
		true
	],
	"listCalendarConnections": [
		"GET",
		"/v1/calendar-connections",
		false
	],
	"authorizeCalendar": [
		"POST",
		"/v1/calendar-connections/:provider/authorize",
		true
	],
	"completeCalendarAuthorization": [
		"POST",
		"/v1/calendar-connections/:provider/complete",
		true
	],
	"updateCalendarConnection": [
		"PATCH",
		"/v1/calendar-connections/:id",
		false
	],
	"deleteCalendarConnection": [
		"DELETE",
		"/v1/calendar-connections/:id",
		false
	],
	"listWebhooks": [
		"GET",
		"/v1/webhooks",
		false
	],
	"createWebhook": [
		"POST",
		"/v1/webhooks",
		true
	],
	"updateWebhook": [
		"PATCH",
		"/v1/webhooks/:id",
		false
	],
	"deleteWebhook": [
		"DELETE",
		"/v1/webhooks/:id",
		false
	],
	"testWebhook": [
		"POST",
		"/v1/webhooks/:id/test",
		true
	],
	"rotateWebhookSecret": [
		"POST",
		"/v1/webhooks/:id/rotate-secret",
		true
	],
	"listWebhookDeliveries": [
		"GET",
		"/v1/webhooks/:id/deliveries",
		false
	],
	"replayWebhookDelivery": [
		"POST",
		"/v1/webhook-deliveries/:id/replay",
		true
	],
	"listApiKeys": [
		"GET",
		"/v1/api-keys",
		false
	],
	"createApiKey": [
		"POST",
		"/v1/api-keys",
		true
	],
	"revokeApiKey": [
		"DELETE",
		"/v1/api-keys/:id",
		false
	],
	"getPublicPage": [
		"GET",
		"/v1/public/pages/:username/:slug",
		false
	],
	"getPublicSlots": [
		"GET",
		"/v1/public/pages/:username/:slug/slots",
		false
	],
	"createPublicBooking": [
		"POST",
		"/v1/public/pages/:username/:slug/bookings",
		true
	],
	"getPublicBookingSlots": [
		"GET",
		"/v1/public/bookings/:id/slots",
		false
	],
	"getPublicBooking": [
		"GET",
		"/v1/public/bookings/:id",
		false
	],
	"cancelPublicBooking": [
		"POST",
		"/v1/public/bookings/:id/cancel",
		false
	],
	"reschedulePublicBooking": [
		"POST",
		"/v1/public/bookings/:id/reschedule",
		false
	],
	"parityListPatchTests": [
		"GET",
		"/v1/parity/patch-tests",
		false
	],
	"parityRecordPatchTest": [
		"POST",
		"/v1/parity/patch-tests",
		true
	],
	"parityListStaffOverrides": [
		"GET",
		"/v1/parity/event-types/:id/staff-overrides",
		false
	],
	"parityPutStaffOverride": [
		"PUT",
		"/v1/parity/event-types/:id/staff-overrides",
		false
	],
	"parityListClientFiles": [
		"GET",
		"/v1/parity/client-files",
		false
	],
	"parityUploadClientFile": [
		"POST",
		"/v1/parity/client-files",
		true
	],
	"parityGetClientFile": [
		"GET",
		"/v1/parity/client-files/:id",
		false
	],
	"parityStartClientFileUpload": [
		"POST",
		"/v1/parity/client-files/uploads",
		true
	],
	"parityGetClientFileLink": [
		"POST",
		"/v1/parity/client-files/:id/link",
		true
	],
	"parityStartAnswerUpload": [
		"POST",
		"/v1/public/event-types/:id/uploads",
		false
	],
	"parityDeleteClientFile": [
		"DELETE",
		"/v1/parity/client-files/:id",
		false
	],
	"parityListSoapNotes": [
		"GET",
		"/v1/parity/soap-notes",
		false
	],
	"paritySaveSoapNote": [
		"PUT",
		"/v1/parity/soap-notes",
		false
	],
	"paritySignSoapNote": [
		"POST",
		"/v1/parity/soap-notes/:id/sign",
		true
	],
	"ideas2GetSettings": [
		"GET",
		"/v1/ideas2/settings",
		false
	],
	"ideas2PutOrgSettings": [
		"PUT",
		"/v1/ideas2/settings/organization",
		false
	],
	"ideas2PutBudget": [
		"PUT",
		"/v1/ideas2/budget",
		false
	],
	"ideas2DeleteBudget": [
		"DELETE",
		"/v1/ideas2/budget",
		false
	],
	"ideas2PutContextPack": [
		"PUT",
		"/v1/ideas2/context-pack",
		false
	],
	"ideas2ListRelays": [
		"GET",
		"/v1/ideas2/relays",
		false
	],
	"ideas2CreateRelay": [
		"POST",
		"/v1/ideas2/relays",
		true
	],
	"ideas2CancelRelay": [
		"POST",
		"/v1/ideas2/relays/:id/cancel",
		true
	],
	"ideas2GetPublicOptIn": [
		"GET",
		"/v1/public/bookings/:id/earlier-slot",
		false
	],
	"ideas2SetPublicOptIn": [
		"PUT",
		"/v1/public/bookings/:id/earlier-slot",
		false
	],
	"ideas2GetPublicSwap": [
		"GET",
		"/v1/public/swap-offer",
		false
	],
	"ideas2AcceptPublicSwap": [
		"POST",
		"/v1/public/swap-offer",
		false
	],
	"ideas2GetPublicRelay": [
		"GET",
		"/v1/public/relay",
		false
	],
	"ideas2SubmitPublicRelay": [
		"POST",
		"/v1/public/relay",
		false
	],
	"parityGetTelegram": [
		"GET",
		"/v1/parity/telegram",
		false
	],
	"parityPutTelegram": [
		"PUT",
		"/v1/parity/telegram",
		false
	],
	"parityDeleteTelegram": [
		"DELETE",
		"/v1/parity/telegram",
		false
	],
	"parityCreateTelegramCode": [
		"POST",
		"/v1/parity/telegram/code",
		true
	],
	"channelsGetLine": [
		"GET",
		"/v1/channels/line",
		false
	],
	"channelsPutLine": [
		"PUT",
		"/v1/channels/line",
		false
	],
	"channelsDeleteLine": [
		"DELETE",
		"/v1/channels/line",
		false
	],
	"channelsPublicChatOptions": [
		"GET",
		"/v1/public/channels/chat-options/:bookingId",
		false
	],
	"channelsClientSubscribe": [
		"POST",
		"/v1/public/channels/subscribe",
		false
	],
	"channelsGetEngagement": [
		"GET",
		"/v1/channels/engagement",
		false
	],
	"channelsPutEngagement": [
		"PUT",
		"/v1/channels/engagement",
		false
	],
	"channelsListKnowledge": [
		"GET",
		"/v1/channels/knowledge",
		false
	],
	"channelsCreateKnowledge": [
		"POST",
		"/v1/channels/knowledge",
		true
	],
	"channelsDeleteKnowledge": [
		"DELETE",
		"/v1/channels/knowledge/:id",
		false
	],
	"channelsListExperiences": [
		"GET",
		"/v1/channels/experiences",
		false
	],
	"channelsCreateExperience": [
		"POST",
		"/v1/channels/experiences",
		true
	],
	"channelsUpdateExperience": [
		"PATCH",
		"/v1/channels/experiences/:id",
		false
	],
	"channelsDeleteExperience": [
		"DELETE",
		"/v1/channels/experiences/:id",
		false
	],
	"channelsLiveInbox": [
		"GET",
		"/v1/channels/live/inbox",
		false
	],
	"channelsLiveSetAvailability": [
		"PUT",
		"/v1/channels/live/availability",
		false
	],
	"channelsLiveAccept": [
		"POST",
		"/v1/channels/live/sessions/:id/accept",
		true
	],
	"channelsLiveJoin": [
		"POST",
		"/v1/channels/live/sessions/:id/join",
		true
	],
	"channelsLiveSend": [
		"POST",
		"/v1/channels/live/sessions/:id/messages",
		true
	],
	"channelsLiveVideo": [
		"POST",
		"/v1/channels/live/sessions/:id/video",
		true
	],
	"channelsLiveClose": [
		"POST",
		"/v1/channels/live/sessions/:id/close",
		true
	],
	"channelsSetPhoneNumberMode": [
		"PUT",
		"/v1/channels/phone-numbers/:id/mode",
		false
	],
	"channelsListPhoneConnects": [
		"GET",
		"/v1/channels/phone-connects",
		false
	],
	"channelsGetExperiences": [
		"GET",
		"/v1/public/chat/:tenantSlug/:widgetKey/experiences",
		false
	],
	"channelsGetBot": [
		"GET",
		"/v1/public/chat/:tenantSlug/:widgetKey/bots/:botId",
		false
	],
	"channelsCompleteBot": [
		"POST",
		"/v1/public/chat/:tenantSlug/:widgetKey/bots/:botId/complete",
		false
	],
	"channelsLivePoll": [
		"POST",
		"/v1/public/chat/:tenantSlug/:widgetKey/live/poll",
		false
	],
	"channelsLiveVisitorSend": [
		"POST",
		"/v1/public/chat/:tenantSlug/:widgetKey/live/messages",
		false
	],
	"channelsGetApple": [
		"GET",
		"/v1/channels/apple",
		false
	],
	"channelsPutApple": [
		"PUT",
		"/v1/channels/apple",
		false
	],
	"channelsDeleteApple": [
		"DELETE",
		"/v1/channels/apple",
		false
	],
	"channelsListAppleThreads": [
		"GET",
		"/v1/channels/apple/threads",
		false
	],
	"channelsGetAppleThread": [
		"GET",
		"/v1/channels/apple/threads/:conversationId",
		false
	],
	"channelsReplyApple": [
		"POST",
		"/v1/channels/apple/threads/:conversationId",
		true
	],
	"channelsGetSettings": [
		"GET",
		"/v1/channels/settings",
		false
	],
	"channelsPutSettings": [
		"PUT",
		"/v1/channels/settings",
		false
	],
	"channelsListPhoneNumbers": [
		"GET",
		"/v1/channels/phone-numbers",
		false
	],
	"channelsAddPhoneNumber": [
		"POST",
		"/v1/channels/phone-numbers",
		true
	],
	"channelsDeletePhoneNumber": [
		"DELETE",
		"/v1/channels/phone-numbers/:id",
		false
	],
	"channelsListCalls": [
		"GET",
		"/v1/channels/calls",
		false
	],
	"channelsListChatSessions": [
		"GET",
		"/v1/channels/chat-sessions",
		false
	],
	"channelsGetBookingContext": [
		"GET",
		"/v1/channels/bookings/:id/context",
		false
	],
	"channelsRecordVisitorSignals": [
		"POST",
		"/v1/public/bookings/:id/visitor-signals",
		false
	],
	"channelsShortcutNextMeeting": [
		"GET",
		"/v1/shortcuts/next-meeting",
		false
	],
	"channelsShortcutBookingLink": [
		"GET",
		"/v1/shortcuts/booking-link",
		false
	],
	"channelsShortcutAvailability": [
		"GET",
		"/v1/shortcuts/availability",
		false
	],
	"channelsListHandoffQueue": [
		"GET",
		"/v1/channels/handoff-queue",
		false
	],
	"channelsClaimHandoff": [
		"POST",
		"/v1/channels/handoff-queue/:id/claim",
		true
	],
	"channelsListNotetakerEvents": [
		"GET",
		"/v1/channels/notetaker/events",
		false
	],
	"channelsPutNotetakerEvent": [
		"PUT",
		"/v1/channels/notetaker/events/:id",
		false
	],
	"channelsGetChat": [
		"GET",
		"/v1/public/chat/:tenantSlug/:widgetKey",
		false
	],
	"channelsStartChat": [
		"POST",
		"/v1/public/chat/:tenantSlug/:widgetKey/sessions",
		false
	],
	"channelsSendChatMessage": [
		"POST",
		"/v1/public/chat/:tenantSlug/:widgetKey/messages",
		false
	],
	"channelsChatHandoff": [
		"POST",
		"/v1/public/chat/:tenantSlug/:widgetKey/handoff",
		false
	],
	"channelsChatSendCode": [
		"POST",
		"/v1/public/chat/:tenantSlug/:widgetKey/verify/send",
		false
	],
	"channelsChatConfirmCode": [
		"POST",
		"/v1/public/chat/:tenantSlug/:widgetKey/verify/confirm",
		false
	],
	"channelsGetPublicConsent": [
		"GET",
		"/v1/public/notetaker-consent/:id",
		false
	],
	"channelsSetPublicConsent": [
		"POST",
		"/v1/public/notetaker-consent/:id",
		false
	],
	"parityListTemplates": [
		"GET",
		"/v1/parity/business-templates",
		false
	],
	"parityPutTemplates": [
		"PUT",
		"/v1/parity/business-templates",
		false
	],
	"parityPutTemplateSync": [
		"PUT",
		"/v1/parity/business-links/:id/template-sync",
		false
	],
	"parityListTemplateCopies": [
		"GET",
		"/v1/parity/business-links/:id/templates",
		false
	],
	"parityPutTemplateLocks": [
		"PUT",
		"/v1/parity/business-links/:id/templates/locks",
		false
	],
	"parityPushTemplates": [
		"POST",
		"/v1/parity/business-links/:id/push",
		true
	],
	"parityListTeamTree": [
		"GET",
		"/v1/parity/teams",
		false
	],
	"parityPutTeamParent": [
		"PUT",
		"/v1/parity/teams/:id/parent",
		false
	],
	"parityListBusinessLinks": [
		"GET",
		"/v1/parity/business-links",
		false
	],
	"parityCreateBusinessLink": [
		"POST",
		"/v1/parity/business-links",
		true
	],
	"parityAcceptBusinessLink": [
		"POST",
		"/v1/parity/business-links/accept",
		true
	],
	"parityDeleteBusinessLink": [
		"DELETE",
		"/v1/parity/business-links/:id",
		false
	],
	"parityBusinessRollup": [
		"GET",
		"/v1/parity/business-rollup",
		false
	],
	"orgsBulkErase": [
		"POST",
		"/v1/privacy/erase/bulk",
		true
	],
	"orgsDeleteBookingData": [
		"POST",
		"/v1/privacy/delete-booking-data",
		true
	],
	"orgsPortalDeleteMyData": [
		"POST",
		"/v1/public/privacy/portal/delete-my-data",
		false
	],
	"orgsAdminDashboard": [
		"GET",
		"/v1/admin/dashboard",
		false
	],
	"orgsGetMemberProfile": [
		"GET",
		"/v1/members/:id/profile",
		false
	],
	"orgsExportMembersCsv": [
		"GET",
		"/v1/members/export",
		false
	],
	"orgsBulkMembers": [
		"POST",
		"/v1/members/bulk",
		true
	],
	"orgsGroupInvite": [
		"POST",
		"/v1/teams/:id/invitations",
		true
	],
	"orgsGroupMeetings": [
		"GET",
		"/v1/teams/:id/meetings",
		false
	],
	"orgsGetDomainControl": [
		"GET",
		"/v1/domain-control",
		false
	],
	"orgsPutDomainControl": [
		"PUT",
		"/v1/domain-control/:id",
		false
	],
	"orgsListDomainUsers": [
		"GET",
		"/v1/domain-control/users",
		false
	],
	"orgsInviteDomainUsers": [
		"POST",
		"/v1/domain-control/invitations",
		true
	],
	"orgsCreateMergeToken": [
		"POST",
		"/v1/organization/merge-token",
		true
	],
	"orgsMergeOrganization": [
		"POST",
		"/v1/organization/merge",
		true
	],
	"orgsGetOrganization": [
		"GET",
		"/v1/organization",
		false
	],
	"orgsUpdateOrganization": [
		"PATCH",
		"/v1/organization",
		false
	],
	"orgsDeleteOrganization": [
		"POST",
		"/v1/organization/delete",
		true
	],
	"orgsListMembers": [
		"GET",
		"/v1/members",
		false
	],
	"orgsUpdateMember": [
		"PATCH",
		"/v1/members/:id",
		false
	],
	"orgsRemoveMember": [
		"DELETE",
		"/v1/members/:id",
		false
	],
	"orgsListInvitations": [
		"GET",
		"/v1/invitations",
		false
	],
	"orgsCreateInvitation": [
		"POST",
		"/v1/invitations",
		true
	],
	"orgsRevokeInvitation": [
		"DELETE",
		"/v1/invitations/:id",
		false
	],
	"orgsGetPublicInvitation": [
		"GET",
		"/v1/public/invitations",
		false
	],
	"orgsAcceptInvitation": [
		"POST",
		"/v1/public/invitations/accept",
		false
	],
	"orgsListTeams": [
		"GET",
		"/v1/teams",
		false
	],
	"orgsCreateTeam": [
		"POST",
		"/v1/teams",
		true
	],
	"orgsGetTeam": [
		"GET",
		"/v1/teams/:id",
		false
	],
	"orgsUpdateTeam": [
		"PATCH",
		"/v1/teams/:id",
		false
	],
	"orgsDeleteTeam": [
		"DELETE",
		"/v1/teams/:id",
		false
	],
	"orgsPutTeamMember": [
		"PUT",
		"/v1/teams/:id/members/:userId",
		false
	],
	"orgsRemoveTeamMember": [
		"DELETE",
		"/v1/teams/:id/members/:userId",
		false
	],
	"orgsListAuditLogs": [
		"GET",
		"/v1/audit-logs",
		false
	],
	"orgsListSessions": [
		"GET",
		"/v1/sessions",
		false
	],
	"orgsRevokeSession": [
		"DELETE",
		"/v1/sessions/:id",
		false
	],
	"orgsListDataExports": [
		"GET",
		"/v1/data-exports",
		false
	],
	"orgsCreateDataExport": [
		"POST",
		"/v1/data-exports",
		true
	],
	"orgsCreateDataExportLink": [
		"POST",
		"/v1/data-exports/:id/link",
		true
	],
	"orgsErasePersonalData": [
		"POST",
		"/v1/privacy/erase",
		true
	],
	"schedulingGetProtectedAnswers": [
		"GET",
		"/v1/bookings/:id/protected-answers",
		false
	],
	"parityGetPageAccess": [
		"GET",
		"/v1/parity/event-types/:id/access",
		false
	],
	"parityPutPageAccess": [
		"PUT",
		"/v1/parity/event-types/:id/access",
		false
	],
	"parityMemberPageProof": [
		"POST",
		"/v1/parity/event-types/:id/member-proof",
		true
	],
	"parityUnlockPage": [
		"POST",
		"/v1/public/page-access/:id/unlock",
		false
	],
	"schedulingBulkUpdateEventTypes": [
		"POST",
		"/v1/event-types/bulk-update",
		true
	],
	"schedulingTranslateEventType": [
		"POST",
		"/v1/event-types/:id/translate",
		true
	],
	"schedulingReportSpam": [
		"POST",
		"/v1/bookings/:id/report-spam",
		true
	],
	"schedulingReserveSlot": [
		"POST",
		"/v1/public/event-types/:id/reservations",
		false
	],
	"schedulingReleaseSlot": [
		"DELETE",
		"/v1/public/event-types/:id/reservations/:holder",
		false
	],
	"schedulingListFilterViews": [
		"GET",
		"/v1/booking-views",
		false
	],
	"schedulingCreateFilterView": [
		"POST",
		"/v1/booking-views",
		true
	],
	"schedulingDeleteFilterView": [
		"DELETE",
		"/v1/booking-views/:id",
		false
	],
	"schedulingListTravel": [
		"GET",
		"/v1/travel-schedules",
		false
	],
	"schedulingCreateTravel": [
		"POST",
		"/v1/travel-schedules",
		true
	],
	"schedulingDeleteTravel": [
		"DELETE",
		"/v1/travel-schedules/:id",
		false
	],
	"schedulingListLabels": [
		"GET",
		"/v1/scheduling/labels",
		false
	],
	"schedulingCreateLabel": [
		"POST",
		"/v1/scheduling/labels",
		true
	],
	"schedulingDeleteLabel": [
		"DELETE",
		"/v1/scheduling/labels/:id",
		false
	],
	"schedulingGetBookingLabels": [
		"GET",
		"/v1/bookings/:id/labels",
		false
	],
	"schedulingPutBookingLabels": [
		"PUT",
		"/v1/bookings/:id/labels",
		false
	],
	"schedulingLabelsFor": [
		"GET",
		"/v1/scheduling/booking-labels",
		false
	],
	"schedulingListStaffColors": [
		"GET",
		"/v1/scheduling/staff-colors",
		false
	],
	"schedulingPutStaffColor": [
		"PUT",
		"/v1/scheduling/staff-colors/:id",
		false
	],
	"schedulingListClosures": [
		"GET",
		"/v1/scheduling/closures",
		false
	],
	"schedulingCreateClosure": [
		"POST",
		"/v1/scheduling/closures",
		true
	],
	"schedulingDeleteClosure": [
		"DELETE",
		"/v1/scheduling/closures/:id",
		false
	],
	"schedulingGetBookingSettings": [
		"GET",
		"/v1/scheduling/booking-settings",
		false
	],
	"schedulingPutBookingSettings": [
		"PUT",
		"/v1/scheduling/booking-settings",
		false
	],
	"schedulingDuplicateEventType": [
		"POST",
		"/v1/event-types/:id/duplicate",
		true
	],
	"schedulingGetUserSchedule": [
		"GET",
		"/v1/availability/users/:id/schedule",
		false
	],
	"schedulingPutUserSchedule": [
		"PUT",
		"/v1/availability/users/:id/schedule",
		false
	],
	"schedulingListBusyTimes": [
		"GET",
		"/v1/availability/busy-times",
		false
	],
	"schedulingListUserLocations": [
		"GET",
		"/v1/users/me/locations",
		false
	],
	"hostopsListOutOfOffice": [
		"GET",
		"/v1/out-of-office",
		false
	],
	"hostopsCreateOutOfOffice": [
		"POST",
		"/v1/out-of-office",
		true
	],
	"hostopsUpdateOutOfOffice": [
		"PUT",
		"/v1/out-of-office/:id",
		false
	],
	"hostopsDeleteOutOfOffice": [
		"DELETE",
		"/v1/out-of-office/:id",
		false
	],
	"hostopsGetEventTypeHosts": [
		"GET",
		"/v1/event-types/:id/hosts",
		false
	],
	"hostopsPutEventTypeHosts": [
		"PUT",
		"/v1/event-types/:id/hosts",
		false
	],
	"hostopsGetBookingSlots": [
		"GET",
		"/v1/bookings/:id/slots",
		false
	],
	"hostopsReassignBooking": [
		"POST",
		"/v1/bookings/:id/reassign",
		true
	],
	"hostopsRequestReschedule": [
		"POST",
		"/v1/bookings/:id/request-reschedule",
		true
	],
	"hostopsChangeLocation": [
		"PATCH",
		"/v1/bookings/:id/location",
		false
	],
	"hostopsWipeDay": [
		"POST",
		"/v1/bookings/wipe-day",
		true
	],
	"hostopsListAssistants": [
		"GET",
		"/v1/assistants",
		false
	],
	"hostopsAddAssistant": [
		"POST",
		"/v1/assistants",
		true
	],
	"hostopsRemoveAssistant": [
		"DELETE",
		"/v1/assistants/:principalId/:assistantId",
		false
	],
	"hostopsPutAssistantProfile": [
		"PUT",
		"/v1/assistants/:principalId/:assistantId",
		false
	],
	"hostopsBookOnBehalf": [
		"POST",
		"/v1/bookings/on-behalf",
		true
	],
	"hostopsTroubleshoot": [
		"GET",
		"/v1/availability/troubleshoot",
		false
	],
	"confirmBooking": [
		"POST",
		"/v1/bookings/:id/confirm",
		true
	],
	"declineBooking": [
		"POST",
		"/v1/bookings/:id/decline",
		true
	],
	"markBookingNoShow": [
		"POST",
		"/v1/bookings/:id/no-show",
		true
	],
	"clearBookingNoShow": [
		"DELETE",
		"/v1/bookings/:id/no-show",
		false
	],
	"updateBookingInvitee": [
		"PATCH",
		"/v1/bookings/:id/invitee",
		false
	],
	"listSchedulingTeams": [
		"GET",
		"/v1/scheduling/teams",
		false
	],
	"getRoundRobinState": [
		"GET",
		"/v1/event-types/:id/round-robin-state",
		false
	],
	"addBookingGuests": [
		"POST",
		"/v1/bookings/:id/guests",
		true
	],
	"listBookingNotes": [
		"GET",
		"/v1/bookings/:id/notes",
		false
	],
	"createBookingNote": [
		"POST",
		"/v1/bookings/:id/notes",
		true
	],
	"deleteBookingNote": [
		"DELETE",
		"/v1/bookings/:id/notes/:noteId",
		false
	],
	"listBookingAudit": [
		"GET",
		"/v1/bookings/:id/audit",
		false
	],
	"getBookingAssignmentReason": [
		"GET",
		"/v1/bookings/:id/assignment-reason",
		false
	],
	"listSchedulingNotePresets": [
		"GET",
		"/v1/scheduling/note-presets",
		false
	],
	"createSchedulingNotePreset": [
		"POST",
		"/v1/scheduling/note-presets",
		true
	],
	"deleteSchedulingNotePreset": [
		"DELETE",
		"/v1/scheduling/note-presets/:id",
		false
	],
	"listNamedSchedules": [
		"GET",
		"/v1/availability/schedules",
		false
	],
	"createNamedSchedule": [
		"POST",
		"/v1/availability/schedules",
		true
	],
	"updateNamedSchedule": [
		"PUT",
		"/v1/availability/schedules/:id",
		false
	],
	"deleteNamedSchedule": [
		"DELETE",
		"/v1/availability/schedules/:id",
		false
	],
	"getTeamCommonSchedule": [
		"GET",
		"/v1/scheduling/teams/:id/common-schedule",
		false
	],
	"putTeamCommonSchedule": [
		"PUT",
		"/v1/scheduling/teams/:id/common-schedule",
		false
	],
	"deleteTeamCommonSchedule": [
		"DELETE",
		"/v1/scheduling/teams/:id/common-schedule",
		false
	],
	"followTeamCommonSchedule": [
		"PUT",
		"/v1/scheduling/teams/:id/common-schedule/follow",
		false
	],
	"updatePublicBookingInvitee": [
		"PATCH",
		"/v1/public/bookings/:id/invitee",
		false
	],
	"addPublicBookingGuests": [
		"POST",
		"/v1/public/bookings/:id/guests",
		false
	],
	"getTeamPublicProfile": [
		"GET",
		"/v1/public/teams/:teamSlug",
		false
	],
	"getTeamPublicPage": [
		"GET",
		"/v1/public/teams/:teamSlug/:slug",
		false
	],
	"getTeamPublicSlots": [
		"GET",
		"/v1/public/teams/:teamSlug/:slug/slots",
		false
	],
	"createTeamPublicBooking": [
		"POST",
		"/v1/public/teams/:teamSlug/:slug/bookings",
		true
	],
	"parityGetRouterTrigger": [
		"GET",
		"/v1/parity/record-routers/:id/trigger",
		false
	],
	"parityTriggerRouter": [
		"POST",
		"/v1/public/routing/record-routers/:id/trigger",
		false
	],
	"listRoutingForms": [
		"GET",
		"/v1/routing/forms",
		false
	],
	"createRoutingForm": [
		"POST",
		"/v1/routing/forms",
		true
	],
	"getRoutingForm": [
		"GET",
		"/v1/routing/forms/:id",
		false
	],
	"updateRoutingForm": [
		"PATCH",
		"/v1/routing/forms/:id",
		false
	],
	"deleteRoutingForm": [
		"DELETE",
		"/v1/routing/forms/:id",
		false
	],
	"testRoutingForm": [
		"POST",
		"/v1/routing/forms/:id/test",
		true
	],
	"listRoutingSubmissions": [
		"GET",
		"/v1/routing/forms/:id/submissions",
		false
	],
	"getRoutingAnalytics": [
		"GET",
		"/v1/routing/forms/:id/analytics",
		false
	],
	"getPublicRoutingForm": [
		"GET",
		"/v1/public/forms/:tenantSlug/:formSlug",
		false
	],
	"submitPublicRoutingForm": [
		"POST",
		"/v1/public/forms/:tenantSlug/:formSlug/submissions",
		false
	],
	"routingPublicSendCode": [
		"POST",
		"/v1/public/forms/:tenantSlug/:formSlug/verify/send",
		false
	],
	"routingPublicConfirmCode": [
		"POST",
		"/v1/public/forms/:tenantSlug/:formSlug/verify/confirm",
		false
	],
	"routingListQueues": [
		"GET",
		"/v1/routing/queues",
		false
	],
	"routingCreateQueue": [
		"POST",
		"/v1/routing/queues",
		true
	],
	"routingUpdateQueue": [
		"PATCH",
		"/v1/routing/queues/:id",
		false
	],
	"routingDeleteQueue": [
		"DELETE",
		"/v1/routing/queues/:id",
		false
	],
	"routingListRecordRouters": [
		"GET",
		"/v1/routing/record-routers",
		false
	],
	"routingCreateRecordRouter": [
		"POST",
		"/v1/routing/record-routers",
		true
	],
	"routingUpdateRecordRouter": [
		"PATCH",
		"/v1/routing/record-routers/:id",
		false
	],
	"routingDeleteRecordRouter": [
		"DELETE",
		"/v1/routing/record-routers/:id",
		false
	],
	"routingRunRecordRouter": [
		"POST",
		"/v1/routing/record-routers/:id/run",
		true
	],
	"routingListRecordAssignments": [
		"GET",
		"/v1/routing/record-routers/:id/assignments",
		false
	],
	"routingAcceptRecordAssignment": [
		"POST",
		"/v1/routing/record-assignments/:id/accept",
		true
	],
	"routingPreviewRecordRouter": [
		"POST",
		"/v1/routing/record-routers/:id/preview",
		true
	],
	"routingMergeRecordDuplicate": [
		"POST",
		"/v1/routing/record-assignments/:id/merge",
		true
	],
	"routingRulesFromText": [
		"POST",
		"/v1/routing/record-rules/from-text",
		true
	],
	"routingCreateHandoff": [
		"POST",
		"/v1/routing/handoffs",
		true
	],
	"routingListHandoffs": [
		"GET",
		"/v1/routing/handoffs",
		false
	],
	"paymentsGetAccount": [
		"GET",
		"/v1/payments/account",
		false
	],
	"paymentsAuthorizeConnect": [
		"POST",
		"/v1/payments/account/authorize",
		true
	],
	"paymentsCompleteConnect": [
		"POST",
		"/v1/payments/account/complete",
		true
	],
	"paymentsDisconnect": [
		"DELETE",
		"/v1/payments/account",
		false
	],
	"paymentsGetEventTypeSettings": [
		"GET",
		"/v1/payments/event-types/:id/settings",
		false
	],
	"paymentsPutEventTypeSettings": [
		"PUT",
		"/v1/payments/event-types/:id/settings",
		false
	],
	"paymentsList": [
		"GET",
		"/v1/payments",
		false
	],
	"paymentsRefund": [
		"POST",
		"/v1/payments/:id/refund",
		true
	],
	"paymentsKeyedConfig": [
		"GET",
		"/v1/payments/keyed/config",
		false
	],
	"paymentsKeyedCharge": [
		"POST",
		"/v1/payments/keyed",
		true
	],
	"paymentsKeyedConfirm": [
		"POST",
		"/v1/payments/keyed/:id/confirm",
		true
	],
	"paymentsListDiscountCodes": [
		"GET",
		"/v1/payments/discount-codes",
		false
	],
	"paymentsCreateDiscountCode": [
		"POST",
		"/v1/payments/discount-codes",
		true
	],
	"paymentsDeactivateDiscountCode": [
		"POST",
		"/v1/payments/discount-codes/:id/deactivate",
		true
	],
	"paymentsListPackages": [
		"GET",
		"/v1/payments/packages",
		false
	],
	"paymentsCreatePackage": [
		"POST",
		"/v1/payments/packages",
		true
	],
	"paymentsDeactivatePackage": [
		"POST",
		"/v1/payments/packages/:id/deactivate",
		true
	],
	"paymentsListMembershipPlans": [
		"GET",
		"/v1/payments/membership-plans",
		false
	],
	"paymentsCreateMembershipPlan": [
		"POST",
		"/v1/payments/membership-plans",
		true
	],
	"paymentsDeactivateMembershipPlan": [
		"POST",
		"/v1/payments/membership-plans/:id/deactivate",
		true
	],
	"paymentsListMemberships": [
		"GET",
		"/v1/payments/memberships",
		false
	],
	"paymentsGetPublicOffer": [
		"GET",
		"/v1/public/payments/offers/:kind/:id",
		false
	],
	"paymentsStartOfferCheckout": [
		"POST",
		"/v1/public/payments/offers/:kind/:id/checkout",
		false
	],
	"paymentsPublicBookingStatus": [
		"GET",
		"/v1/public/payments/bookings/:id",
		false
	],
	"parityGetSmsSender": [
		"GET",
		"/v1/parity/sms-sender",
		false
	],
	"parityPutSmsSender": [
		"PUT",
		"/v1/parity/sms-sender",
		false
	],
	"parityDeleteSmsSender": [
		"DELETE",
		"/v1/parity/sms-sender",
		false
	],
	"smsGetLegalDisclaimer": [
		"GET",
		"/v1/sms/legal-disclaimer",
		false
	],
	"smsPutLegalDisclaimer": [
		"PUT",
		"/v1/sms/legal-disclaimer",
		false
	],
	"smsListInboxThreads": [
		"GET",
		"/v1/sms/inbox",
		false
	],
	"smsGetInboxThread": [
		"GET",
		"/v1/sms/inbox/:phone",
		false
	],
	"smsInboxReply": [
		"POST",
		"/v1/sms/inbox/:phone",
		true
	],
	"getSmsSettings": [
		"GET",
		"/v1/sms/settings",
		false
	],
	"updateSmsSettings": [
		"PUT",
		"/v1/sms/settings",
		false
	],
	"getSmsEventTypeSettings": [
		"GET",
		"/v1/sms/event-types/:id",
		false
	],
	"putSmsEventTypeSettings": [
		"PUT",
		"/v1/sms/event-types/:id",
		false
	],
	"listSmsMessages": [
		"GET",
		"/v1/sms/messages",
		false
	],
	"listSmsOptOuts": [
		"GET",
		"/v1/sms/opt-outs",
		false
	],
	"getSmsMyPhone": [
		"GET",
		"/v1/sms/phone",
		false
	],
	"startSmsPhoneVerification": [
		"POST",
		"/v1/sms/phone/verifications",
		true
	],
	"confirmSmsPhoneVerification": [
		"POST",
		"/v1/sms/phone/verifications/:id/confirm",
		true
	],
	"videoGetZoomSettings": [
		"GET",
		"/v1/event-types/:id/zoom-settings",
		false
	],
	"videoPutZoomSettings": [
		"PUT",
		"/v1/event-types/:id/zoom-settings",
		false
	],
	"videoMeetQueue": [
		"GET",
		"/v1/video/meet/queue",
		false
	],
	"videoGetZoomOrg": [
		"GET",
		"/v1/video/zoom-org",
		false
	],
	"videoPutZoomOrg": [
		"PUT",
		"/v1/video/zoom-org",
		false
	],
	"videoDeleteZoomOrg": [
		"DELETE",
		"/v1/video/zoom-org",
		false
	],
	"videoGetWebinarSettings": [
		"GET",
		"/v1/event-types/:id/webinar",
		false
	],
	"videoPutWebinarSettings": [
		"PUT",
		"/v1/event-types/:id/webinar",
		false
	],
	"videoGetWebinarAccounts": [
		"GET",
		"/v1/video-connections/webinars",
		false
	],
	"videoAuthorizeGoto": [
		"POST",
		"/v1/video-connections/goto/authorize",
		true
	],
	"videoCompleteGoto": [
		"POST",
		"/v1/video-connections/goto/complete",
		true
	],
	"videoDeleteGoto": [
		"DELETE",
		"/v1/video-connections/goto",
		false
	],
	"videoListConnections": [
		"GET",
		"/v1/video-connections",
		false
	],
	"videoAuthorizeZoom": [
		"POST",
		"/v1/video-connections/zoom/authorize",
		true
	],
	"videoCompleteZoomAuthorization": [
		"POST",
		"/v1/video-connections/zoom/complete",
		true
	],
	"videoDeleteConnection": [
		"DELETE",
		"/v1/video-connections/:id",
		false
	],
	"videoMeetHostToken": [
		"POST",
		"/v1/video/meet/:id/host-token",
		true
	],
	"videoMeetGuestLog": [
		"GET",
		"/v1/video/meet/:id/guests",
		false
	],
	"videoMeetJoin": [
		"POST",
		"/v1/public/video/meet/:id/join",
		false
	],
	"videoMeetEvents": [
		"GET",
		"/v1/public/video/meet/:id/events",
		false
	],
	"videoMeetSignal": [
		"POST",
		"/v1/public/video/meet/:id/signal",
		false
	],
	"videoMeetAdmit": [
		"POST",
		"/v1/public/video/meet/:id/admit",
		false
	],
	"videoMeetLeave": [
		"POST",
		"/v1/public/video/meet/:id/leave",
		false
	],
	"videoMeetSfuToken": [
		"POST",
		"/v1/public/video/meet/:id/sfu-token",
		false
	],
	"videoMeetStartRecording": [
		"POST",
		"/v1/public/video/meet/:id/recordings",
		false
	],
	"videoMeetFinishRecording": [
		"POST",
		"/v1/public/video/meet/:id/recordings/done",
		false
	],
	"videoMeetRecordingMedia": [
		"GET",
		"/v1/video/recordings/:id/media",
		false
	],
	"parityListConnectors": [
		"GET",
		"/v1/parity/connectors",
		false
	],
	"parityPutConnector": [
		"PUT",
		"/v1/parity/connectors",
		false
	],
	"parityDeleteConnector": [
		"DELETE",
		"/v1/parity/connectors/:kind",
		false
	],
	"paritySyncConnector": [
		"POST",
		"/v1/parity/connectors/:kind/sync",
		true
	],
	"parityGetVital": [
		"GET",
		"/v1/parity/vital",
		false
	],
	"parityPutVital": [
		"PUT",
		"/v1/parity/vital",
		false
	],
	"crmListGreenhouseLinks": [
		"GET",
		"/v1/crm/greenhouse/links",
		false
	],
	"crmCreateGreenhouseLink": [
		"POST",
		"/v1/crm/greenhouse/links",
		true
	],
	"crmDeleteGreenhouseLink": [
		"DELETE",
		"/v1/crm/greenhouse/links/:id",
		false
	],
	"crmGetGreenhouseBooking": [
		"GET",
		"/v1/crm/greenhouse/bookings/:id",
		false
	],
	"crmAttachGreenhouseLink": [
		"POST",
		"/v1/public/bookings/:id/greenhouse",
		false
	],
	"crmGetLinkedin": [
		"GET",
		"/v1/crm/linkedin",
		false
	],
	"crmLinkedinAuthorize": [
		"POST",
		"/v1/crm/linkedin/authorize",
		true
	],
	"crmLinkedinComplete": [
		"POST",
		"/v1/crm/linkedin/complete",
		true
	],
	"crmPutLinkedin": [
		"PUT",
		"/v1/crm/linkedin",
		false
	],
	"crmDeleteLinkedin": [
		"DELETE",
		"/v1/crm/linkedin",
		false
	],
	"crmSyncLinkedin": [
		"POST",
		"/v1/crm/linkedin/sync",
		true
	],
	"crmListConnections": [
		"GET",
		"/v1/crm/connections",
		false
	],
	"crmAuthorize": [
		"POST",
		"/v1/crm/connections/:provider/authorize",
		true
	],
	"crmCompleteAuthorization": [
		"POST",
		"/v1/crm/connections/:provider/complete",
		true
	],
	"crmUpdateConnection": [
		"PATCH",
		"/v1/crm/connections/:id",
		false
	],
	"crmDeleteConnection": [
		"DELETE",
		"/v1/crm/connections/:id",
		false
	],
	"crmListEnvironments": [
		"GET",
		"/v1/crm/connections/:id/environments",
		false
	],
	"crmSelectEnvironment": [
		"POST",
		"/v1/crm/connections/:id/environment",
		true
	],
	"crmListSyncLogs": [
		"GET",
		"/v1/crm/sync-logs",
		false
	],
	"analyticsGetMetrics": [
		"GET",
		"/v1/analytics/metrics",
		false
	],
	"analyticsExportCsv": [
		"GET",
		"/v1/analytics/export",
		false
	],
	"developerListOAuthApps": [
		"GET",
		"/v1/developer/oauth-apps",
		false
	],
	"developerCreateOAuthApp": [
		"POST",
		"/v1/developer/oauth-apps",
		true
	],
	"developerDeleteOAuthApp": [
		"DELETE",
		"/v1/developer/oauth-apps/:id",
		false
	],
	"developerListRequestLogs": [
		"GET",
		"/v1/developer/request-logs",
		false
	],
	"developerListAuthorizedApps": [
		"GET",
		"/v1/developer/authorized-apps",
		false
	],
	"developerRevokeAuthorizedApp": [
		"DELETE",
		"/v1/developer/authorized-apps/:id",
		false
	],
	"developerGetConsent": [
		"GET",
		"/v1/oauth/consent",
		false
	],
	"developerApproveConsent": [
		"POST",
		"/v1/oauth/consent",
		true
	],
	"developerCreateListener": [
		"POST",
		"/v1/developer/listeners",
		true
	],
	"developerTriggerEvent": [
		"POST",
		"/v1/developer/events/trigger",
		true
	],
	"getSsoSettings": [
		"GET",
		"/v1/sso/settings",
		false
	],
	"updateSsoSettings": [
		"PUT",
		"/v1/sso/settings",
		false
	],
	"listSsoDomains": [
		"GET",
		"/v1/sso/domains",
		false
	],
	"createSsoDomain": [
		"POST",
		"/v1/sso/domains",
		true
	],
	"verifySsoDomain": [
		"POST",
		"/v1/sso/domains/:id/verify",
		true
	],
	"deleteSsoDomain": [
		"DELETE",
		"/v1/sso/domains/:id",
		false
	],
	"listSsoConnections": [
		"GET",
		"/v1/sso/connections",
		false
	],
	"createSsoConnection": [
		"POST",
		"/v1/sso/connections",
		true
	],
	"updateSsoConnection": [
		"PATCH",
		"/v1/sso/connections/:id",
		false
	],
	"deleteSsoConnection": [
		"DELETE",
		"/v1/sso/connections/:id",
		false
	],
	"testSsoConnection": [
		"POST",
		"/v1/sso/connections/:id/test",
		true
	],
	"listScimTokens": [
		"GET",
		"/v1/sso/scim-tokens",
		false
	],
	"createScimToken": [
		"POST",
		"/v1/sso/scim-tokens",
		true
	],
	"revokeScimToken": [
		"DELETE",
		"/v1/sso/scim-tokens/:id",
		false
	],
	"ssoDiscover": [
		"GET",
		"/v1/public/sso/discover",
		false
	],
	"ssoNativeExchange": [
		"POST",
		"/v1/auth/sso/native",
		false
	],
	"ideas2ListIncidents": [
		"GET",
		"/v1/ideas2/calendar-incidents",
		false
	],
	"parityGetDefense": [
		"GET",
		"/v1/parity/defense",
		false
	],
	"parityPutDefense": [
		"PUT",
		"/v1/parity/defense",
		false
	],
	"parityListMeetingChecks": [
		"GET",
		"/v1/parity/meeting-checks",
		false
	],
	"parityListDeclinedInvites": [
		"GET",
		"/v1/parity/declined-invites",
		false
	],
	"parityListMovableMeetings": [
		"GET",
		"/v1/parity/movable-meetings",
		false
	],
	"parityMoveMeeting": [
		"POST",
		"/v1/parity/movable-meetings/move",
		true
	],
	"calsyncGetAvailPrefs": [
		"GET",
		"/v1/calendar-ai/prefs",
		false
	],
	"calsyncPutAvailPrefs": [
		"PUT",
		"/v1/calendar-ai/prefs",
		false
	],
	"calsyncGetQualityRules": [
		"GET",
		"/v1/calendar-ai/quality-rules",
		false
	],
	"calsyncPutQualityRules": [
		"PUT",
		"/v1/calendar-ai/quality-rules",
		false
	],
	"calsyncListQualityChecks": [
		"GET",
		"/v1/calendar-ai/quality-checks",
		false
	],
	"calsyncListHolds": [
		"GET",
		"/v1/calendar-ai/holds",
		false
	],
	"calsyncCreateHolds": [
		"POST",
		"/v1/calendar-ai/holds",
		true
	],
	"calsyncReleaseHolds": [
		"DELETE",
		"/v1/calendar-ai/holds/:id",
		false
	],
	"calsyncListShares": [
		"GET",
		"/v1/calendar-ai/shares",
		false
	],
	"calsyncCreateShare": [
		"POST",
		"/v1/calendar-ai/shares",
		true
	],
	"calsyncUpdateShare": [
		"PATCH",
		"/v1/calendar-ai/shares/:id",
		false
	],
	"calsyncRevokeShare": [
		"DELETE",
		"/v1/calendar-ai/shares/:id",
		false
	],
	"calsyncPublicGetShare": [
		"GET",
		"/v1/public/freebusy-shares/:token",
		false
	],
	"calsyncPublicConnectShare": [
		"POST",
		"/v1/public/freebusy-shares/:token",
		false
	],
	"calsyncPublicRevokeShare": [
		"DELETE",
		"/v1/public/freebusy-shares/:token",
		false
	],
	"calsyncListSmartMeetings": [
		"GET",
		"/v1/calendar-ai/smart-meetings",
		false
	],
	"calsyncAddSmartMeeting": [
		"POST",
		"/v1/calendar-ai/smart-meetings",
		true
	],
	"calsyncDeleteSmartMeeting": [
		"DELETE",
		"/v1/calendar-ai/smart-meetings/:id",
		false
	],
	"calsyncGetStats": [
		"GET",
		"/v1/calendar-ai/stats",
		false
	],
	"calsyncGetPlanner": [
		"GET",
		"/v1/calendar-ai/planner",
		false
	],
	"calsyncPlannerMove": [
		"POST",
		"/v1/calendar-ai/planner/move",
		true
	],
	"calsyncFastmailOverlay": [
		"POST",
		"/v1/public/overlay/fastmail",
		false
	],
	"calsyncGetStatus": [
		"GET",
		"/v1/calsync/status",
		false
	],
	"calsyncGetSettings": [
		"GET",
		"/v1/calsync/settings",
		false
	],
	"calsyncUpdateSettings": [
		"PUT",
		"/v1/calsync/settings",
		false
	],
	"listDomains": [
		"GET",
		"/v1/domains",
		false
	],
	"createDomain": [
		"POST",
		"/v1/domains",
		true
	],
	"verifyDomain": [
		"POST",
		"/v1/domains/:id/verify",
		true
	],
	"deleteDomain": [
		"DELETE",
		"/v1/domains/:id",
		false
	],
	"getDomainsBranding": [
		"GET",
		"/v1/branding",
		false
	],
	"updateDomainsBranding": [
		"PATCH",
		"/v1/branding",
		false
	],
	"getDomainsLocale": [
		"GET",
		"/v1/users/me/locale",
		false
	],
	"updateDomainsLocale": [
		"PUT",
		"/v1/users/me/locale",
		false
	],
	"getDomainsPublicBranding": [
		"GET",
		"/v1/public/branding/:username",
		false
	],
	"getDomainSite": [
		"GET",
		"/v1/public/sites/current",
		false
	],
	"getDomainsSiteSettings": [
		"GET",
		"/v1/branding/site",
		false
	],
	"updateDomainsSiteSettings": [
		"PATCH",
		"/v1/branding/site",
		false
	],
	"listDomainsSitePages": [
		"GET",
		"/v1/branding/site/pages",
		false
	],
	"createDomainsSitePage": [
		"POST",
		"/v1/branding/site/pages",
		true
	],
	"updateDomainsSitePage": [
		"PATCH",
		"/v1/branding/site/pages/:id",
		false
	],
	"deleteDomainsSitePage": [
		"DELETE",
		"/v1/branding/site/pages/:id",
		false
	],
	"listDomainsGallery": [
		"GET",
		"/v1/branding/site/gallery",
		false
	],
	"createDomainsGalleryItem": [
		"POST",
		"/v1/branding/site/gallery",
		true
	],
	"deleteDomainsGalleryItem": [
		"DELETE",
		"/v1/branding/site/gallery/:id",
		false
	],
	"getDomainsInstagram": [
		"GET",
		"/v1/branding/site/instagram",
		false
	],
	"authorizeDomainsInstagram": [
		"POST",
		"/v1/branding/site/instagram/authorize",
		true
	],
	"completeDomainsInstagram": [
		"POST",
		"/v1/branding/site/instagram/complete",
		true
	],
	"refreshDomainsInstagram": [
		"POST",
		"/v1/branding/site/instagram/refresh",
		true
	],
	"disconnectDomainsInstagram": [
		"DELETE",
		"/v1/branding/site/instagram",
		false
	],
	"getDomainsTeamBranding": [
		"GET",
		"/v1/branding/teams/:id",
		false
	],
	"putDomainsTeamBranding": [
		"PUT",
		"/v1/branding/teams/:id",
		false
	],
	"listDomainsReviews": [
		"GET",
		"/v1/branding/reviews",
		false
	],
	"publishDomainsReview": [
		"PUT",
		"/v1/branding/reviews/:id",
		false
	],
	"listDomainsContactMessages": [
		"GET",
		"/v1/branding/contact-messages",
		false
	],
	"updateDomainsContactMessage": [
		"PATCH",
		"/v1/branding/contact-messages/:id",
		false
	],
	"deleteDomainsContactMessage": [
		"DELETE",
		"/v1/branding/contact-messages/:id",
		false
	],
	"scanDomainsTicket": [
		"POST",
		"/v1/branding/tickets/scan",
		true
	],
	"getDomainSiteBySlug": [
		"GET",
		"/v1/public/sites/by-slug/:tenantSlug",
		false
	],
	"getDomainsPublicTeamBranding": [
		"GET",
		"/v1/public/branding/teams/:teamSlug",
		false
	],
	"getDomainsPublicReviews": [
		"GET",
		"/v1/public/reviews/:username",
		false
	],
	"submitDomainsContact": [
		"POST",
		"/v1/public/contact/:tenantSlug",
		false
	],
	"getDomainsTicket": [
		"GET",
		"/v1/public/bookings/:id/ticket",
		false
	],
	"parityImportDoodle": [
		"POST",
		"/v1/parity/doodle-import",
		true
	],
	"listPolls": [
		"GET",
		"/v1/polls",
		false
	],
	"createPoll": [
		"POST",
		"/v1/polls",
		true
	],
	"getPollFreeSlots": [
		"GET",
		"/v1/polls/free-slots",
		false
	],
	"getPoll": [
		"GET",
		"/v1/polls/:id",
		false
	],
	"updatePoll": [
		"PATCH",
		"/v1/polls/:id",
		false
	],
	"deletePoll": [
		"DELETE",
		"/v1/polls/:id",
		false
	],
	"duplicatePoll": [
		"POST",
		"/v1/polls/:id/duplicate",
		true
	],
	"invitePollParticipants": [
		"POST",
		"/v1/polls/:id/participants",
		true
	],
	"finalizePoll": [
		"POST",
		"/v1/polls/:id/finalize",
		true
	],
	"getPublicPoll": [
		"GET",
		"/v1/public/polls/:id",
		false
	],
	"respondPublicPoll": [
		"POST",
		"/v1/public/polls/:id/responses",
		false
	],
	"exportPollCsv": [
		"GET",
		"/v1/polls/:id/export",
		false
	],
	"deletePollComment": [
		"DELETE",
		"/v1/polls/:id/comments/:commentId",
		false
	],
	"commentPublicPoll": [
		"POST",
		"/v1/public/polls/:id/comments",
		false
	],
	"reopenPoll": [
		"POST",
		"/v1/polls/:id/reopen",
		true
	],
	"revokePollInvite": [
		"DELETE",
		"/v1/polls/:id/participants/:participantId",
		false
	],
	"reschedulePollEvent": [
		"POST",
		"/v1/polls/:id/reschedule",
		true
	],
	"cancelPollEvent": [
		"POST",
		"/v1/polls/:id/cancel-event",
		true
	],
	"rsvpPublicPoll": [
		"POST",
		"/v1/public/polls/:id/rsvp",
		false
	],
	"parityGetRoster": [
		"GET",
		"/v1/parity/class-sessions/:id/roster",
		false
	],
	"paritySetCheckIn": [
		"PUT",
		"/v1/parity/bookings/:id/check-in",
		false
	],
	"parityGetClassLayout": [
		"GET",
		"/v1/parity/classes/:id/layout",
		false
	],
	"parityPutClassLayout": [
		"PUT",
		"/v1/parity/classes/:id/layout",
		false
	],
	"parityPublicSpots": [
		"GET",
		"/v1/public/bookings/:id/spots",
		false
	],
	"parityPublicPickSpot": [
		"POST",
		"/v1/public/bookings/:id/spot",
		false
	],
	"servicesListServices": [
		"GET",
		"/v1/services/catalog",
		false
	],
	"servicesCreateService": [
		"POST",
		"/v1/services/catalog",
		true
	],
	"servicesUpdateService": [
		"PATCH",
		"/v1/services/catalog/:id",
		false
	],
	"servicesListStaff": [
		"GET",
		"/v1/services/staff",
		false
	],
	"servicesCreateStaff": [
		"POST",
		"/v1/services/staff",
		true
	],
	"servicesUpdateStaff": [
		"PATCH",
		"/v1/services/staff/:id",
		false
	],
	"servicesListStaffHours": [
		"GET",
		"/v1/services/staff/:id/hours",
		false
	],
	"servicesPutStaffHours": [
		"PUT",
		"/v1/services/staff/:id/hours/:locationId",
		false
	],
	"servicesDeleteStaffHours": [
		"DELETE",
		"/v1/services/staff/:id/hours/:locationId",
		false
	],
	"servicesListLocations": [
		"GET",
		"/v1/services/locations",
		false
	],
	"servicesCreateLocation": [
		"POST",
		"/v1/services/locations",
		true
	],
	"servicesUpdateLocation": [
		"PATCH",
		"/v1/services/locations/:id",
		false
	],
	"servicesListResources": [
		"GET",
		"/v1/services/resources",
		false
	],
	"servicesCreateResource": [
		"POST",
		"/v1/services/resources",
		true
	],
	"servicesUpdateResource": [
		"PATCH",
		"/v1/services/resources/:id",
		false
	],
	"servicesListCustomers": [
		"GET",
		"/v1/services/customers",
		false
	],
	"servicesGetCustomer": [
		"GET",
		"/v1/services/customers/:id",
		false
	],
	"servicesCustomerBookings": [
		"GET",
		"/v1/services/customers/:id/bookings",
		false
	],
	"servicesUpdateCustomer": [
		"PATCH",
		"/v1/services/customers/:id",
		false
	],
	"servicesListBookings": [
		"GET",
		"/v1/services/bookings",
		false
	],
	"servicesCancelBooking": [
		"POST",
		"/v1/services/bookings/:id/cancel",
		true
	],
	"servicesRescheduleBooking": [
		"POST",
		"/v1/services/bookings/:id/reschedule",
		true
	],
	"servicesGetPublicPage": [
		"GET",
		"/v1/public/services/:tenantSlug",
		false
	],
	"servicesGetPublicSlots": [
		"GET",
		"/v1/public/services/:tenantSlug/slots",
		false
	],
	"servicesCreatePublicBooking": [
		"POST",
		"/v1/public/services/:tenantSlug/bookings",
		true
	],
	"parityImportTasks": [
		"POST",
		"/v1/parity/task-imports",
		true
	],
	"parityListTaskSources": [
		"GET",
		"/v1/parity/task-sources",
		false
	],
	"parityDeleteTaskSource": [
		"DELETE",
		"/v1/parity/task-sources/:id",
		false
	],
	"aiGetAssistSettings": [
		"GET",
		"/v1/ai/assist-settings",
		false
	],
	"aiPutAssistSettings": [
		"PUT",
		"/v1/ai/assist-settings",
		false
	],
	"aiGetAgentDomain": [
		"GET",
		"/v1/ai/agent-domain",
		false
	],
	"aiPutAgentDomain": [
		"PUT",
		"/v1/ai/agent-domain",
		false
	],
	"aiVerifyAgentDomain": [
		"POST",
		"/v1/ai/agent-domain/verify",
		true
	],
	"aiListFollowupDrafts": [
		"GET",
		"/v1/ai/followups",
		false
	],
	"aiSendFollowupDraft": [
		"POST",
		"/v1/ai/followups/:id/send",
		true
	],
	"aiDiscardFollowupDraft": [
		"DELETE",
		"/v1/ai/followups/:id",
		false
	],
	"aiListEmailTemplates": [
		"GET",
		"/v1/ai/email-templates",
		false
	],
	"aiCreateEmailTemplate": [
		"POST",
		"/v1/ai/email-templates",
		true
	],
	"aiUpdateEmailTemplate": [
		"PUT",
		"/v1/ai/email-templates/:id",
		false
	],
	"aiDeleteEmailTemplate": [
		"DELETE",
		"/v1/ai/email-templates/:id",
		false
	],
	"aiDraftEmailTemplate": [
		"POST",
		"/v1/ai/email-templates/draft",
		true
	],
	"aiListExceptionRequests": [
		"GET",
		"/v1/ai/exceptions",
		false
	],
	"aiDecideExceptionRequest": [
		"POST",
		"/v1/ai/exceptions/:id",
		true
	],
	"aiSetupGenerate": [
		"POST",
		"/v1/ai/setup",
		true
	],
	"aiSendMessage": [
		"POST",
		"/v1/ai/messages",
		true
	],
	"aiListConversations": [
		"GET",
		"/v1/ai/conversations",
		false
	],
	"aiGetConversation": [
		"GET",
		"/v1/ai/conversations/:id",
		false
	],
	"aiDeleteConversation": [
		"DELETE",
		"/v1/ai/conversations/:id",
		false
	],
	"aiConfirmAction": [
		"POST",
		"/v1/ai/actions/:id/confirm",
		true
	],
	"aiCancelAction": [
		"POST",
		"/v1/ai/actions/:id/cancel",
		true
	],
	"aiGetSuggestions": [
		"GET",
		"/v1/ai/suggestions",
		false
	],
	"aiGetWorkload": [
		"GET",
		"/v1/ai/workload",
		false
	],
	"aiGetPreferences": [
		"GET",
		"/v1/ai/preferences",
		false
	],
	"aiUpdatePreferences": [
		"PUT",
		"/v1/ai/preferences",
		false
	],
	"aiGetEmailAgent": [
		"GET",
		"/v1/ai/email-agent",
		false
	],
	"aiUpdateEmailAgent": [
		"PUT",
		"/v1/ai/email-agent",
		false
	],
	"aiRotateEmailAgent": [
		"POST",
		"/v1/ai/email-agent/rotate",
		true
	],
	"aiListEmailMessages": [
		"GET",
		"/v1/ai/email-agent/messages",
		false
	],
	"aiGetVoiceSettings": [
		"GET",
		"/v1/ai/voice-settings",
		false
	],
	"aiPutVoiceSettings": [
		"PUT",
		"/v1/ai/voice-settings",
		false
	],
	"aiPublicVoiceCodeSend": [
		"POST",
		"/v1/public/ai/event-types/:id/voice-consent/send",
		false
	],
	"aiPublicVoiceCodeConfirm": [
		"POST",
		"/v1/public/ai/event-types/:id/voice-consent/confirm",
		false
	],
	"aiListVoiceCalls": [
		"GET",
		"/v1/ai/voice-calls",
		false
	],
	"aiListHabits": [
		"GET",
		"/v1/ai/habits",
		false
	],
	"aiCreateHabit": [
		"POST",
		"/v1/ai/habits",
		true
	],
	"aiUpdateHabit": [
		"PUT",
		"/v1/ai/habits/:id",
		false
	],
	"aiDeleteHabit": [
		"DELETE",
		"/v1/ai/habits/:id",
		false
	],
	"calconnectGoogleStatus": [
		"GET",
		"/v1/calconnect/google",
		false
	],
	"calconnectGoogleAuthorize": [
		"POST",
		"/v1/calconnect/google/authorize",
		true
	],
	"calconnectGoogleUpdateSettings": [
		"PATCH",
		"/v1/calconnect/google",
		false
	],
	"calconnectGoogleSyncNow": [
		"POST",
		"/v1/calconnect/google/sync",
		true
	],
	"calconnectContactEmails": [
		"GET",
		"/v1/calconnect/google/contacts/:id/emails",
		false
	],
	"calconnectListFollowups": [
		"GET",
		"/v1/calconnect/google/followups",
		false
	],
	"calconnectDismissFollowup": [
		"POST",
		"/v1/calconnect/google/followups/dismiss",
		true
	],
	"calconnectFollowupTask": [
		"POST",
		"/v1/calconnect/google/followups/task",
		true
	],
	"calconnectListTasks": [
		"GET",
		"/v1/calconnect/google/tasks",
		false
	],
	"calconnectBookingTask": [
		"POST",
		"/v1/calconnect/google/tasks",
		true
	],
	"calconnectCompleteTask": [
		"POST",
		"/v1/calconnect/google/tasks/:id/complete",
		true
	],
	"calconnectListDriveUploads": [
		"GET",
		"/v1/calconnect/google/drive",
		false
	],
	"calconnectDriveCopyBooking": [
		"POST",
		"/v1/calconnect/google/drive/bookings/:id",
		true
	],
	"calconnectConnectCaldav": [
		"POST",
		"/v1/calconnect/connections/caldav",
		true
	],
	"calconnectConnectIcloud": [
		"POST",
		"/v1/calconnect/connections/icloud",
		true
	],
	"calconnectConnectEws": [
		"POST",
		"/v1/calconnect/connections/ews",
		true
	],
	"calconnectConnectIcs": [
		"POST",
		"/v1/calconnect/connections/ics",
		true
	],
	"calconnectIcsReport": [
		"GET",
		"/v1/calconnect/connections/:id/ics-report",
		false
	],
	"calconnectListBlockRules": [
		"GET",
		"/v1/calconnect/block-rules",
		false
	],
	"calconnectCreateBlockRule": [
		"POST",
		"/v1/calconnect/block-rules",
		true
	],
	"calconnectDeleteBlockRule": [
		"DELETE",
		"/v1/calconnect/block-rules/:id",
		false
	],
	"calconnectListDelegations": [
		"GET",
		"/v1/calconnect/delegations",
		false
	],
	"calconnectSaveDelegation": [
		"POST",
		"/v1/calconnect/delegations",
		true
	],
	"calconnectSyncDelegation": [
		"POST",
		"/v1/calconnect/delegations/:id/sync",
		true
	],
	"calconnectDeleteDelegation": [
		"DELETE",
		"/v1/calconnect/delegations/:id",
		false
	],
	"ideasGetNoShowRisk": [
		"GET",
		"/v1/ideas/bookings/:id/no-show-risk",
		false
	],
	"ideas2GetFairness": [
		"GET",
		"/v1/ideas2/fairness/:id",
		false
	],
	"ideas2ListSeries": [
		"GET",
		"/v1/ideas2/series",
		false
	],
	"ideas2GetTimezoneFairness": [
		"GET",
		"/v1/ideas2/series/:id/timezone-fairness",
		false
	],
	"parityLocationRollup": [
		"GET",
		"/v1/parity/location-rollup",
		false
	],
	"insightsGetSettings": [
		"GET",
		"/v1/insights/settings",
		false
	],
	"insightsUpdateSettings": [
		"PUT",
		"/v1/insights/settings",
		false
	],
	"insightsGetOverview": [
		"GET",
		"/v1/insights/overview",
		false
	],
	"insightsListFeedback": [
		"GET",
		"/v1/insights/feedback",
		false
	],
	"insightsGetRouting": [
		"GET",
		"/v1/insights/routing",
		false
	],
	"insightsGetFunnel": [
		"GET",
		"/v1/insights/funnel",
		false
	],
	"insightsGetSla": [
		"GET",
		"/v1/insights/sla",
		false
	],
	"insightsGetOoo": [
		"GET",
		"/v1/insights/out-of-office",
		false
	],
	"insightsListWrongAssignments": [
		"GET",
		"/v1/insights/wrong-assignments",
		false
	],
	"insightsCreateWrongAssignment": [
		"POST",
		"/v1/insights/wrong-assignments",
		true
	],
	"insightsResolveWrongAssignment": [
		"POST",
		"/v1/insights/wrong-assignments/:id/resolve",
		true
	],
	"insightsListHostNoShows": [
		"GET",
		"/v1/insights/host-no-shows",
		false
	],
	"insightsSetHostNoShow": [
		"PUT",
		"/v1/insights/host-no-shows/:id",
		false
	],
	"insightsClearHostNoShow": [
		"DELETE",
		"/v1/insights/host-no-shows/:id",
		false
	],
	"insightsGetPublicFeedback": [
		"GET",
		"/v1/public/feedback/:id",
		false
	],
	"insightsSubmitPublicFeedback": [
		"POST",
		"/v1/public/feedback/:id",
		false
	],
	"ideasPublicWhyNot": [
		"POST",
		"/v1/public/pages/:username/:slug/why-not",
		false
	],
	"ideasTeamPublicWhyNot": [
		"POST",
		"/v1/public/teams/:teamSlug/:slug/why-not",
		false
	],
	"ideasDryRun": [
		"POST",
		"/v1/ideas/dry-run",
		true
	],
	"ideasRoutingReplay": [
		"POST",
		"/v1/ideas/routing-replay",
		true
	],
	"surfacesGetAgentPolicy": [
		"GET",
		"/v1/surfaces/agent-policy",
		false
	],
	"surfacesPutAgentPolicy": [
		"PUT",
		"/v1/surfaces/agent-policy",
		false
	],
	"surfacesGetMcpInfo": [
		"GET",
		"/v1/surfaces/mcp",
		false
	],
	"surfacesListAgentApprovals": [
		"GET",
		"/v1/surfaces/agent-approvals",
		false
	],
	"surfacesDecideAgentApproval": [
		"POST",
		"/v1/surfaces/agent-approvals/:id/decision",
		true
	],
	"managedListAttributes": [
		"GET",
		"/v1/managed/attributes",
		false
	],
	"managedCreateAttribute": [
		"POST",
		"/v1/managed/attributes",
		true
	],
	"managedUpdateAttribute": [
		"PATCH",
		"/v1/managed/attributes/:id",
		false
	],
	"managedDeleteAttribute": [
		"DELETE",
		"/v1/managed/attributes/:id",
		false
	],
	"managedListMemberAttributes": [
		"GET",
		"/v1/managed/member-attributes",
		false
	],
	"managedGetMemberAttributes": [
		"GET",
		"/v1/managed/members/:id/attributes",
		false
	],
	"managedPutMemberAttributes": [
		"PUT",
		"/v1/managed/members/:id/attributes",
		false
	],
	"managedListAttributeSyncRules": [
		"GET",
		"/v1/managed/attribute-sync-rules",
		false
	],
	"managedCreateAttributeSyncRule": [
		"POST",
		"/v1/managed/attribute-sync-rules",
		true
	],
	"managedDeleteAttributeSyncRule": [
		"DELETE",
		"/v1/managed/attribute-sync-rules/:id",
		false
	],
	"managedRunCrmAttributeSync": [
		"POST",
		"/v1/managed/attribute-sync-rules/run",
		true
	],
	"managedListRoles": [
		"GET",
		"/v1/managed/roles",
		false
	],
	"managedCreateRole": [
		"POST",
		"/v1/managed/roles",
		true
	],
	"managedUpdateRole": [
		"PATCH",
		"/v1/managed/roles/:id",
		false
	],
	"managedDeleteRole": [
		"DELETE",
		"/v1/managed/roles/:id",
		false
	],
	"managedAssignMemberRole": [
		"PUT",
		"/v1/managed/members/:id/role",
		false
	],
	"managedListTemplates": [
		"GET",
		"/v1/managed/templates",
		false
	],
	"managedCreateTemplate": [
		"POST",
		"/v1/managed/templates",
		true
	],
	"managedUpdateTemplate": [
		"PATCH",
		"/v1/managed/templates/:id",
		false
	],
	"managedDeleteTemplate": [
		"DELETE",
		"/v1/managed/templates/:id",
		false
	],
	"managedSyncTemplate": [
		"POST",
		"/v1/managed/templates/:id/sync",
		true
	],
	"managedGetEventTypeLocks": [
		"GET",
		"/v1/managed/event-types/:id/locks",
		false
	],
	"importsList": [
		"GET",
		"/v1/imports",
		false
	],
	"importsStartApi": [
		"POST",
		"/v1/imports/api",
		true
	],
	"importsUploadCsv": [
		"POST",
		"/v1/imports/csv",
		true
	],
	"importsGet": [
		"GET",
		"/v1/imports/:id",
		false
	],
	"ideasIssueReceipt": [
		"POST",
		"/v1/ideas/bookings/:id/receipt",
		true
	],
	"ideasIssuePublicReceipt": [
		"POST",
		"/v1/public/ideas/bookings/:id/receipt",
		false
	],
	"ideasVerifyReceipt": [
		"POST",
		"/v1/public/ideas/receipts/verify",
		false
	],
	"trustGetLegal": [
		"GET",
		"/v1/trust/legal",
		false
	],
	"trustPutLegal": [
		"PUT",
		"/v1/trust/legal",
		false
	],
	"trustPublicLegal": [
		"GET",
		"/v1/public/trust/legal/:eventTypeId",
		false
	],
	"trustReportAbuse": [
		"POST",
		"/v1/public/trust/abuse-reports",
		false
	],
	"adminListAbuseReports": [
		"GET",
		"/v1/admin/abuse-reports",
		false
	],
	"adminResolveAbuseReport": [
		"POST",
		"/v1/admin/abuse-reports/:id/resolve",
		true
	],
	"trustListSendLog": [
		"GET",
		"/v1/trust/send-log",
		false
	],
	"trustCheckLinks": [
		"POST",
		"/v1/trust/check-links",
		true
	],
	"trustGetSettings": [
		"GET",
		"/v1/trust/settings",
		false
	],
	"trustUpdateSettings": [
		"PUT",
		"/v1/trust/settings",
		false
	],
	"trustGetHipaa": [
		"GET",
		"/v1/trust/hipaa",
		false
	],
	"trustAcceptBaa": [
		"POST",
		"/v1/trust/hipaa/baa",
		true
	],
	"trustSetHipaa": [
		"PUT",
		"/v1/trust/hipaa",
		false
	],
	"trustListBlocklist": [
		"GET",
		"/v1/trust/blocklist",
		false
	],
	"trustAddBlocklist": [
		"POST",
		"/v1/trust/blocklist",
		true
	],
	"trustRemoveBlocklist": [
		"DELETE",
		"/v1/trust/blocklist/:id",
		false
	],
	"trustExportAuditLogs": [
		"GET",
		"/v1/trust/audit-logs/export",
		false
	],
	"trustEraseInvitee": [
		"POST",
		"/v1/trust/erasure",
		true
	],
	"trustGetSmtp": [
		"GET",
		"/v1/trust/smtp",
		false
	],
	"trustPutSmtp": [
		"PUT",
		"/v1/trust/smtp",
		false
	],
	"trustDeleteSmtp": [
		"DELETE",
		"/v1/trust/smtp",
		false
	],
	"trustTestSmtp": [
		"POST",
		"/v1/trust/smtp/test",
		true
	],
	"trustGetMailSender": [
		"GET",
		"/v1/trust/mail-sender",
		false
	],
	"trustAuthorizeMailSender": [
		"POST",
		"/v1/trust/mail-sender/:provider/authorize",
		true
	],
	"trustCompleteMailSender": [
		"POST",
		"/v1/trust/mail-sender/:provider/complete",
		true
	],
	"trustDeleteMailSender": [
		"DELETE",
		"/v1/trust/mail-sender",
		false
	],
	"trustGetLdap": [
		"GET",
		"/v1/trust/ldap",
		false
	],
	"trustPutLdap": [
		"PUT",
		"/v1/trust/ldap",
		false
	],
	"trustDeleteLdap": [
		"DELETE",
		"/v1/trust/ldap",
		false
	],
	"trustTestLdap": [
		"POST",
		"/v1/trust/ldap/test",
		true
	],
	"trustLdapLogin": [
		"POST",
		"/v1/auth/ldap/login",
		false
	],
	"trustPublicConfig": [
		"GET",
		"/v1/public/trust/event-types/:id",
		false
	],
	"trustPublicPowChallenge": [
		"POST",
		"/v1/public/trust/event-types/:id/challenge",
		false
	],
	"trustPublicSendCode": [
		"POST",
		"/v1/public/trust/event-types/:id/verify/send",
		false
	],
	"trustPublicConfirmCode": [
		"POST",
		"/v1/public/trust/event-types/:id/verify/confirm",
		false
	],
	"recordingsListRecapShares": [
		"GET",
		"/v1/recordings/:id/shares",
		false
	],
	"recordingsShareRecap": [
		"POST",
		"/v1/recordings/:id/shares",
		true
	],
	"recordingsRevokeRecapShare": [
		"DELETE",
		"/v1/recordings/:id/shares/:shareId",
		false
	],
	"recordingsListSharedRecaps": [
		"GET",
		"/v1/recaps/shared",
		false
	],
	"recordingsPublicRecap": [
		"GET",
		"/v1/public/recaps/:token",
		false
	],
	"recordingsPushRecapToCrm": [
		"POST",
		"/v1/recordings/:id/crm",
		true
	],
	"recordingsList": [
		"GET",
		"/v1/recordings",
		false
	],
	"recordingsGet": [
		"GET",
		"/v1/recordings/:id",
		false
	],
	"recordingsDelete": [
		"DELETE",
		"/v1/recordings/:id",
		false
	],
	"recordingsGenerateNotes": [
		"POST",
		"/v1/recordings/:id/notes",
		true
	],
	"recordingsUpdateNotes": [
		"PATCH",
		"/v1/recordings/:id/notes",
		false
	],
	"recordingsListEventSettings": [
		"GET",
		"/v1/recordings-settings/event-types",
		false
	],
	"recordingsPutEventSettings": [
		"PUT",
		"/v1/recordings-settings/event-types/:id",
		false
	],
	"recordingsProviderStatus": [
		"GET",
		"/v1/recordings-settings/providers",
		false
	],
	"recordingsListConnections": [
		"GET",
		"/v1/recordings-settings/connections",
		false
	],
	"recordingsAuthorizeWebex": [
		"POST",
		"/v1/recordings-settings/connections/webex/authorize",
		true
	],
	"recordingsCompleteWebex": [
		"POST",
		"/v1/recordings-settings/connections/webex/complete",
		true
	],
	"recordingsDeleteConnection": [
		"DELETE",
		"/v1/recordings-settings/connections/:id",
		false
	],
	"recordingsListRoomCredentials": [
		"GET",
		"/v1/recordings-settings/rooms",
		false
	],
	"recordingsPutRoomCredential": [
		"PUT",
		"/v1/recordings-settings/rooms",
		false
	],
	"recordingsDeleteRoomCredential": [
		"DELETE",
		"/v1/recordings-settings/rooms/:provider",
		false
	],
	"recordingsAuthorizeRoom": [
		"POST",
		"/v1/recordings-settings/rooms/:provider/authorize",
		true
	],
	"recordingsCompleteRoom": [
		"POST",
		"/v1/recordings-settings/rooms/:provider/complete",
		true
	],
	"recordingsAuthorizeRingcentral": [
		"POST",
		"/v1/recordings-settings/connections/ringcentral/authorize",
		true
	],
	"recordingsCompleteRingcentral": [
		"POST",
		"/v1/recordings-settings/connections/ringcentral/complete",
		true
	],
	"recordingsGetRetention": [
		"GET",
		"/v1/recordings-settings/retention",
		false
	],
	"recordingsPutRetention": [
		"PUT",
		"/v1/recordings-settings/retention",
		false
	],
	"recordingsAuthorizeCalendarScopes": [
		"POST",
		"/v1/recordings-settings/calendar-scopes/:provider/authorize",
		true
	],
	"recordingsGetInstantSettings": [
		"GET",
		"/v1/recordings-settings/instant",
		false
	],
	"recordingsPutInstantSettings": [
		"PUT",
		"/v1/recordings-settings/instant",
		false
	],
	"recordingsListInstantRequests": [
		"GET",
		"/v1/recordings-instant/requests",
		false
	],
	"recordingsAcceptInstant": [
		"POST",
		"/v1/recordings-instant/requests/:id/accept",
		true
	],
	"recordingsDeclineInstant": [
		"POST",
		"/v1/recordings-instant/requests/:id/decline",
		true
	],
	"recordingsGetPublicConsent": [
		"GET",
		"/v1/public/recording-consent/:id",
		false
	],
	"recordingsSetPublicConsent": [
		"POST",
		"/v1/public/recording-consent/:id",
		false
	],
	"recordingsGetPublicInstantHost": [
		"GET",
		"/v1/public/instant/hosts/:username",
		false
	],
	"recordingsStartPublicInstant": [
		"POST",
		"/v1/public/instant/hosts/:username",
		false
	],
	"recordingsPollPublicInstant": [
		"GET",
		"/v1/public/instant/sessions/:id",
		false
	],
	"parityGetVenmo": [
		"GET",
		"/v1/parity/venmo",
		false
	],
	"parityPutVenmo": [
		"PUT",
		"/v1/parity/venmo",
		false
	],
	"commerceGetSettings": [
		"GET",
		"/v1/commerce/settings",
		false
	],
	"commercePutSettings": [
		"PUT",
		"/v1/commerce/settings",
		false
	],
	"commerceGetPaypal": [
		"GET",
		"/v1/commerce/paypal",
		false
	],
	"commerceConnectPaypal": [
		"PUT",
		"/v1/commerce/paypal",
		false
	],
	"commerceDisconnectPaypal": [
		"DELETE",
		"/v1/commerce/paypal",
		false
	],
	"commerceListClasses": [
		"GET",
		"/v1/commerce/classes",
		false
	],
	"commerceCreateClass": [
		"POST",
		"/v1/commerce/classes",
		true
	],
	"commerceUpdateClass": [
		"PATCH",
		"/v1/commerce/classes/:id",
		false
	],
	"commerceAddClassSessions": [
		"POST",
		"/v1/commerce/classes/:id/sessions",
		true
	],
	"commerceCancelClassSession": [
		"POST",
		"/v1/commerce/class-sessions/:id/cancel",
		true
	],
	"commerceListWaitlist": [
		"GET",
		"/v1/commerce/waitlist",
		false
	],
	"commerceRemoveWaitlistEntry": [
		"DELETE",
		"/v1/commerce/waitlist/:id",
		false
	],
	"commerceListGiftCards": [
		"GET",
		"/v1/commerce/gift-cards",
		false
	],
	"commerceIssueGiftCard": [
		"POST",
		"/v1/commerce/gift-cards",
		true
	],
	"commerceVoidGiftCard": [
		"POST",
		"/v1/commerce/gift-cards/:id/void",
		true
	],
	"commerceListAddOns": [
		"GET",
		"/v1/commerce/add-ons",
		false
	],
	"commerceCreateAddOn": [
		"POST",
		"/v1/commerce/add-ons",
		true
	],
	"commerceUpdateAddOn": [
		"PATCH",
		"/v1/commerce/add-ons/:id",
		false
	],
	"commerceListTaxRates": [
		"GET",
		"/v1/commerce/tax-rates",
		false
	],
	"commerceCreateTaxRate": [
		"POST",
		"/v1/commerce/tax-rates",
		true
	],
	"commerceGetEventTypeTaxRate": [
		"GET",
		"/v1/commerce/event-types/:id/tax-rate",
		false
	],
	"commercePutEventTypeTaxRate": [
		"PUT",
		"/v1/commerce/event-types/:id/tax-rate",
		false
	],
	"commerceDeactivateTaxRate": [
		"POST",
		"/v1/commerce/tax-rates/:id/deactivate",
		true
	],
	"commerceTaxReport": [
		"GET",
		"/v1/commerce/reports/tax",
		false
	],
	"commerceListCommissionRules": [
		"GET",
		"/v1/commerce/commissions",
		false
	],
	"commercePutCommissionRule": [
		"PUT",
		"/v1/commerce/commissions",
		false
	],
	"commerceEarningsReport": [
		"GET",
		"/v1/commerce/reports/earnings",
		false
	],
	"commerceSplitTip": [
		"POST",
		"/v1/commerce/tips/split",
		true
	],
	"commerceFutureRevenueReport": [
		"GET",
		"/v1/commerce/reports/future-revenue",
		false
	],
	"commerceStaffPerformanceReport": [
		"GET",
		"/v1/commerce/reports/staff-performance",
		false
	],
	"commerceListInvoices": [
		"GET",
		"/v1/commerce/invoices",
		false
	],
	"commerceCreateInvoice": [
		"POST",
		"/v1/commerce/invoices",
		true
	],
	"commerceSendInvoice": [
		"POST",
		"/v1/commerce/invoices/:id/send",
		true
	],
	"commerceVoidInvoice": [
		"POST",
		"/v1/commerce/invoices/:id/void",
		true
	],
	"commerceRecordInvoicePayment": [
		"POST",
		"/v1/commerce/invoices/:id/record-payment",
		true
	],
	"commerceChargeInvoiceCard": [
		"POST",
		"/v1/commerce/invoices/:id/charge-card",
		true
	],
	"commerceListEstimates": [
		"GET",
		"/v1/commerce/estimates",
		false
	],
	"commerceCreateEstimate": [
		"POST",
		"/v1/commerce/estimates",
		true
	],
	"commerceSendEstimate": [
		"POST",
		"/v1/commerce/estimates/:id/send",
		true
	],
	"commerceConvertEstimate": [
		"POST",
		"/v1/commerce/estimates/:id/convert",
		true
	],
	"commerceListPaymentLinks": [
		"GET",
		"/v1/commerce/payment-links",
		false
	],
	"commerceCreatePaymentLink": [
		"POST",
		"/v1/commerce/payment-links",
		true
	],
	"commerceDeactivatePaymentLink": [
		"POST",
		"/v1/commerce/payment-links/:id/deactivate",
		true
	],
	"commerceListForms": [
		"GET",
		"/v1/commerce/forms",
		false
	],
	"commerceCreateForm": [
		"POST",
		"/v1/commerce/forms",
		true
	],
	"commerceUpdateForm": [
		"PATCH",
		"/v1/commerce/forms/:id",
		false
	],
	"commercePutFormEventTypes": [
		"PUT",
		"/v1/commerce/forms/:id/event-types",
		false
	],
	"commerceListWalkIns": [
		"GET",
		"/v1/commerce/walk-ins",
		false
	],
	"commerceCreateWalkIn": [
		"POST",
		"/v1/commerce/walk-ins",
		true
	],
	"commerceUpdateWalkIn": [
		"PATCH",
		"/v1/commerce/walk-ins/:id",
		false
	],
	"commerceCustomerProfile": [
		"GET",
		"/v1/commerce/customers/profile",
		false
	],
	"commercePublicCatalog": [
		"GET",
		"/v1/public/commerce/:tenantSlug/catalog",
		false
	],
	"commercePublicEventExtras": [
		"GET",
		"/v1/public/commerce/event-extras/:username/:slug",
		false
	],
	"commercePublicTeamExtras": [
		"GET",
		"/v1/public/commerce/team-extras/:teamSlug/:slug",
		false
	],
	"commercePublicBook": [
		"POST",
		"/v1/public/commerce/:tenantSlug/book",
		true
	],
	"commercePublicMultiSlots": [
		"GET",
		"/v1/public/commerce/:tenantSlug/multi-slots",
		false
	],
	"commercePublicMultiBook": [
		"POST",
		"/v1/public/commerce/:tenantSlug/multi-book",
		false
	],
	"commercePublicJoinWaitlist": [
		"POST",
		"/v1/public/commerce/:tenantSlug/waitlist",
		false
	],
	"commercePublicWaitlistOffer": [
		"GET",
		"/v1/public/commerce/waitlist-offers/:token",
		false
	],
	"commercePublicConfirmWaitlist": [
		"POST",
		"/v1/public/commerce/waitlist-confirm/:token",
		false
	],
	"commercePublicClaimOffer": [
		"POST",
		"/v1/public/commerce/waitlist-offers/:token/claim",
		false
	],
	"commercePublicBuyGiftCard": [
		"POST",
		"/v1/public/commerce/:tenantSlug/gift-cards",
		false
	],
	"commercePublicInvoice": [
		"GET",
		"/v1/public/commerce/invoices/:id",
		false
	],
	"commercePublicPayInvoice": [
		"POST",
		"/v1/public/commerce/invoices/:id/pay",
		false
	],
	"commercePublicEstimate": [
		"GET",
		"/v1/public/commerce/estimates/:id",
		false
	],
	"commercePublicRespondEstimate": [
		"POST",
		"/v1/public/commerce/estimates/:id/respond",
		false
	],
	"commercePublicPaymentLink": [
		"GET",
		"/v1/public/commerce/payment-links/:id",
		false
	],
	"commercePublicPaymentLinkCheckout": [
		"POST",
		"/v1/public/commerce/payment-links/:id/checkout",
		false
	],
	"commercePublicForm": [
		"GET",
		"/v1/public/commerce/forms/:token",
		false
	],
	"commercePublicSubmitForm": [
		"POST",
		"/v1/public/commerce/forms/:token",
		false
	],
	"commercePublicOptOut": [
		"POST",
		"/v1/public/commerce/opt-out",
		false
	],
	"commercePaypalCapture": [
		"POST",
		"/v1/public/commerce/paypal/capture",
		false
	],
	"commercePortalRequestLogin": [
		"POST",
		"/v1/public/commerce/:tenantSlug/portal/login",
		false
	],
	"commercePortalVerify": [
		"POST",
		"/v1/public/commerce/portal/verify",
		false
	],
	"commercePortalMe": [
		"GET",
		"/v1/public/commerce/portal/me",
		false
	],
	"commercePortalLogout": [
		"POST",
		"/v1/public/commerce/portal/logout",
		false
	],
	"commercePortalOptOut": [
		"PUT",
		"/v1/public/commerce/portal/opt-out",
		false
	],
	"commercePortalLeaveWaitlist": [
		"DELETE",
		"/v1/public/commerce/portal/waitlist/:id",
		false
	],
	"commercePortalStartCardSetup": [
		"POST",
		"/v1/public/commerce/portal/cards/setup",
		false
	],
	"commercePortalRemoveCard": [
		"DELETE",
		"/v1/public/commerce/portal/cards/:id",
		false
	],
	"retailGetSettings": [
		"GET",
		"/v1/retail/settings",
		false
	],
	"retailPutSettings": [
		"PUT",
		"/v1/retail/settings",
		false
	],
	"retailListProducts": [
		"GET",
		"/v1/retail/products",
		false
	],
	"retailCreateProduct": [
		"POST",
		"/v1/retail/products",
		true
	],
	"retailUpdateProduct": [
		"PATCH",
		"/v1/retail/products/:id",
		false
	],
	"retailCreateVariant": [
		"POST",
		"/v1/retail/products/:id/variants",
		true
	],
	"retailUpdateVariant": [
		"PATCH",
		"/v1/retail/variants/:id",
		false
	],
	"retailAdjustStock": [
		"POST",
		"/v1/retail/variants/:id/stock",
		true
	],
	"retailFindBarcode": [
		"GET",
		"/v1/retail/barcodes/:code",
		false
	],
	"retailListStockMoves": [
		"GET",
		"/v1/retail/variants/:id/stock",
		false
	],
	"retailListSuppliers": [
		"GET",
		"/v1/retail/suppliers",
		false
	],
	"retailCreateSupplier": [
		"POST",
		"/v1/retail/suppliers",
		true
	],
	"retailUpdateSupplier": [
		"PATCH",
		"/v1/retail/suppliers/:id",
		false
	],
	"retailListPurchaseOrders": [
		"GET",
		"/v1/retail/purchase-orders",
		false
	],
	"retailCreatePurchaseOrder": [
		"POST",
		"/v1/retail/purchase-orders",
		true
	],
	"retailOrderPurchaseOrder": [
		"POST",
		"/v1/retail/purchase-orders/:id/order",
		true
	],
	"retailReceivePurchaseOrder": [
		"POST",
		"/v1/retail/purchase-orders/:id/receive",
		true
	],
	"retailCancelPurchaseOrder": [
		"POST",
		"/v1/retail/purchase-orders/:id/cancel",
		true
	],
	"retailListStockCounts": [
		"GET",
		"/v1/retail/stock-counts",
		false
	],
	"retailCreateStockCount": [
		"POST",
		"/v1/retail/stock-counts",
		true
	],
	"retailCurrentShift": [
		"GET",
		"/v1/retail/shifts/current",
		false
	],
	"retailListShifts": [
		"GET",
		"/v1/retail/shifts",
		false
	],
	"retailOpenShift": [
		"POST",
		"/v1/retail/shifts",
		true
	],
	"retailCashMove": [
		"POST",
		"/v1/retail/shifts/:id/cash-moves",
		true
	],
	"retailCloseShift": [
		"POST",
		"/v1/retail/shifts/:id/close",
		true
	],
	"retailShiftReport": [
		"GET",
		"/v1/retail/shifts/:id/report",
		false
	],
	"retailListSales": [
		"GET",
		"/v1/retail/sales",
		false
	],
	"retailCreateSale": [
		"POST",
		"/v1/retail/sales",
		true
	],
	"retailQuoteSale": [
		"POST",
		"/v1/retail/sales/quote",
		true
	],
	"retailGetSale": [
		"GET",
		"/v1/retail/sales/:id",
		false
	],
	"retailCheckTerminal": [
		"POST",
		"/v1/retail/sales/:id/terminal/check",
		true
	],
	"retailStartTerminal": [
		"POST",
		"/v1/retail/sales/:id/terminal/start",
		true
	],
	"retailVoidSale": [
		"POST",
		"/v1/retail/sales/:id/void",
		true
	],
	"retailRefundSale": [
		"POST",
		"/v1/retail/sales/:id/refunds",
		true
	],
	"retailEmailReceipt": [
		"POST",
		"/v1/retail/sales/:id/receipt",
		true
	],
	"retailListReaders": [
		"GET",
		"/v1/retail/terminal/readers",
		false
	],
	"retailRegisterReader": [
		"POST",
		"/v1/retail/terminal/readers",
		true
	],
	"retailDeleteReader": [
		"DELETE",
		"/v1/retail/terminal/readers/:id",
		false
	],
	"retailListTerminalLocations": [
		"GET",
		"/v1/retail/terminal/locations",
		false
	],
	"retailCreateTerminalLocation": [
		"POST",
		"/v1/retail/terminal/locations",
		true
	],
	"retailCustomer": [
		"GET",
		"/v1/retail/customer",
		false
	],
	"retailMyClock": [
		"GET",
		"/v1/retail/clock",
		false
	],
	"retailClockIn": [
		"POST",
		"/v1/retail/clock/in",
		true
	],
	"retailClockOut": [
		"POST",
		"/v1/retail/clock/out",
		true
	],
	"retailListTimeEntries": [
		"GET",
		"/v1/retail/time-entries",
		false
	],
	"retailUpdateTimeEntry": [
		"PATCH",
		"/v1/retail/time-entries/:id",
		false
	],
	"retailPayrollReport": [
		"GET",
		"/v1/retail/payroll",
		false
	],
	"retailPayrollCsv": [
		"GET",
		"/v1/retail/payroll/export",
		false
	],
	"retailPutPayrollCode": [
		"PUT",
		"/v1/retail/payroll/codes/:id",
		false
	],
	"retailListWageRates": [
		"GET",
		"/v1/retail/wage-rates",
		false
	],
	"retailCreateWageRate": [
		"POST",
		"/v1/retail/wage-rates",
		true
	],
	"retailDeactivateWageRate": [
		"POST",
		"/v1/retail/wage-rates/:id/deactivate",
		true
	],
	"retailLaborReport": [
		"GET",
		"/v1/retail/reports/labor",
		false
	],
	"retailListRewards": [
		"GET",
		"/v1/retail/rewards",
		false
	],
	"retailCreateReward": [
		"POST",
		"/v1/retail/rewards",
		true
	],
	"retailDeactivateReward": [
		"POST",
		"/v1/retail/rewards/:id/deactivate",
		true
	],
	"retailAdjustPoints": [
		"POST",
		"/v1/retail/loyalty/adjust",
		true
	],
	"retailLoyaltyLedger": [
		"GET",
		"/v1/retail/loyalty/ledger",
		false
	],
	"retailListCampaigns": [
		"GET",
		"/v1/retail/campaigns",
		false
	],
	"retailCreateCampaign": [
		"POST",
		"/v1/retail/campaigns",
		true
	],
	"retailScheduleCampaign": [
		"POST",
		"/v1/retail/campaigns/:id/schedule",
		true
	],
	"retailActivateWinback": [
		"POST",
		"/v1/retail/campaigns/:id/activate",
		true
	],
	"retailCancelCampaign": [
		"POST",
		"/v1/retail/campaigns/:id/cancel",
		true
	],
	"retailPreviewSegment": [
		"POST",
		"/v1/retail/campaigns/preview",
		true
	],
	"retailSetMarketingConsent": [
		"POST",
		"/v1/retail/marketing-consent",
		true
	],
	"retailAccountingList": [
		"GET",
		"/v1/retail/accounting",
		false
	],
	"retailAccountingAuthorize": [
		"POST",
		"/v1/retail/accounting/:provider/authorize",
		true
	],
	"retailAccountingComplete": [
		"POST",
		"/v1/retail/accounting/:provider/complete",
		true
	],
	"retailAccountingUpdate": [
		"PATCH",
		"/v1/retail/accounting/connections/:id",
		false
	],
	"retailAccountingDisconnect": [
		"DELETE",
		"/v1/retail/accounting/connections/:id",
		false
	],
	"retailAccountingListSync": [
		"GET",
		"/v1/retail/accounting/connections/:id/sync",
		false
	],
	"retailAccountingRetry": [
		"POST",
		"/v1/retail/accounting/connections/:id/retry",
		true
	],
	"retailListKiosks": [
		"GET",
		"/v1/retail/kiosks",
		false
	],
	"retailCreateKiosk": [
		"POST",
		"/v1/retail/kiosks",
		true
	],
	"retailDeactivateKiosk": [
		"POST",
		"/v1/retail/kiosks/:id/deactivate",
		true
	],
	"retailQueue": [
		"GET",
		"/v1/retail/queue",
		false
	],
	"retailCallWalkIn": [
		"POST",
		"/v1/retail/queue/:id/call",
		true
	],
	"retailStartWalkIn": [
		"POST",
		"/v1/retail/queue/:id/start",
		true
	],
	"retailFinishWalkIn": [
		"POST",
		"/v1/retail/queue/:id/finish",
		true
	],
	"retailListResourceHolds": [
		"GET",
		"/v1/retail/resource-holds",
		false
	],
	"retailCreateResourceHold": [
		"POST",
		"/v1/retail/resource-holds",
		true
	],
	"retailDeleteResourceHold": [
		"DELETE",
		"/v1/retail/resource-holds/:id",
		false
	],
	"retailListListings": [
		"GET",
		"/v1/retail/directory",
		false
	],
	"retailPutListing": [
		"PUT",
		"/v1/retail/directory/:id",
		false
	],
	"retailPublicStore": [
		"GET",
		"/v1/public/retail/:tenantSlug/store",
		false
	],
	"retailPublicCheckout": [
		"POST",
		"/v1/public/retail/:tenantSlug/checkout",
		false
	],
	"retailPublicReceipt": [
		"GET",
		"/v1/public/retail/receipts/:token",
		false
	],
	"retailPublicUnsubscribe": [
		"POST",
		"/v1/public/retail/unsubscribe",
		false
	],
	"retailPublicKiosk": [
		"GET",
		"/v1/public/retail/kiosks/:token",
		false
	],
	"retailPublicCheckIn": [
		"POST",
		"/v1/public/retail/kiosks/:token/check-in",
		false
	],
	"retailPublicTicket": [
		"GET",
		"/v1/public/retail/tickets/:token",
		false
	],
	"retailPublicListing": [
		"GET",
		"/v1/public/retail/places/:slug",
		false
	],
	"retailPublicDirectory": [
		"GET",
		"/v1/public/retail/places",
		false
	],
	"parityGetFollowups": [
		"GET",
		"/v1/parity/followups",
		false
	],
	"parityPutFollowups": [
		"PUT",
		"/v1/parity/followups",
		false
	],
	"listWorkflows": [
		"GET",
		"/v1/workflows",
		false
	],
	"createWorkflow": [
		"POST",
		"/v1/workflows",
		true
	],
	"listWorkflowTemplates": [
		"GET",
		"/v1/workflows/templates",
		false
	],
	"listWorkflowEventTypes": [
		"GET",
		"/v1/workflows/event-types",
		false
	],
	"previewWorkflow": [
		"POST",
		"/v1/workflows/preview",
		true
	],
	"listWorkflowRuns": [
		"GET",
		"/v1/workflows/runs",
		false
	],
	"getWorkflow": [
		"GET",
		"/v1/workflows/:id",
		false
	],
	"updateWorkflow": [
		"PATCH",
		"/v1/workflows/:id",
		false
	],
	"deleteWorkflow": [
		"DELETE",
		"/v1/workflows/:id",
		false
	],
	"getPublicReconfirmation": [
		"GET",
		"/v1/public/reconfirmations/:id",
		false
	],
	"confirmPublicReconfirmation": [
		"POST",
		"/v1/public/reconfirmations/:id",
		false
	],
	"appsDirectory": [
		"GET",
		"/v1/apps",
		false
	],
	"appsSlackAuthorize": [
		"POST",
		"/v1/apps/slack/authorize",
		true
	],
	"appsSlackComplete": [
		"POST",
		"/v1/apps/slack/complete",
		true
	],
	"appsSlackListInstalls": [
		"GET",
		"/v1/apps/slack/installs",
		false
	],
	"appsSlackDeleteInstall": [
		"DELETE",
		"/v1/apps/slack/installs/:id",
		false
	],
	"appsSlackListChannelOptions": [
		"GET",
		"/v1/apps/slack/installs/:id/channels",
		false
	],
	"appsListChannels": [
		"GET",
		"/v1/apps/channels",
		false
	],
	"appsCreateChannel": [
		"POST",
		"/v1/apps/channels",
		true
	],
	"appsUpdateChannel": [
		"PATCH",
		"/v1/apps/channels/:id",
		false
	],
	"appsDeleteChannel": [
		"DELETE",
		"/v1/apps/channels/:id",
		false
	],
	"appsTestChannel": [
		"POST",
		"/v1/apps/channels/:id/test",
		true
	],
	"appsListDeliveries": [
		"GET",
		"/v1/apps/deliveries",
		false
	],
	"appsListConnections": [
		"GET",
		"/v1/apps/connections",
		false
	],
	"appsCreateConnection": [
		"POST",
		"/v1/apps/connections",
		true
	],
	"appsUpdateConnection": [
		"PATCH",
		"/v1/apps/connections/:id",
		false
	],
	"appsDeleteConnection": [
		"DELETE",
		"/v1/apps/connections/:id",
		false
	],
	"appsListHooks": [
		"GET",
		"/v1/apps/hooks",
		false
	],
	"appsSubscribeHook": [
		"POST",
		"/v1/apps/hooks",
		true
	],
	"appsUnsubscribeHook": [
		"DELETE",
		"/v1/apps/hooks/:id",
		false
	],
	"appsHookSamples": [
		"GET",
		"/v1/apps/hooks/samples/:event",
		false
	],
	"appsListTracking": [
		"GET",
		"/v1/apps/tracking",
		false
	],
	"appsGetTracking": [
		"GET",
		"/v1/apps/tracking/:eventTypeId",
		false
	],
	"appsPutTracking": [
		"PUT",
		"/v1/apps/tracking/:eventTypeId",
		false
	],
	"appsPublicTracking": [
		"GET",
		"/v1/public/apps/tracking/:eventTypeId",
		false
	],
	"appsGiphySearch": [
		"GET",
		"/v1/apps/giphy/search",
		false
	],
	"appsGetWeather": [
		"GET",
		"/v1/apps/weather",
		false
	],
	"appsPutWeather": [
		"PUT",
		"/v1/apps/weather",
		false
	],
	"appsDeleteWeather": [
		"DELETE",
		"/v1/apps/weather",
		false
	],
	"appsWeatherPlaces": [
		"GET",
		"/v1/apps/weather/places",
		false
	],
	"billingListPlans": [
		"GET",
		"/v1/public/billing/plans",
		false
	],
	"billingGetOverview": [
		"GET",
		"/v1/billing",
		false
	],
	"billingStartCheckout": [
		"POST",
		"/v1/billing/checkout",
		true
	],
	"billingChangePlan": [
		"POST",
		"/v1/billing/subscription/plan",
		true
	],
	"billingCancel": [
		"POST",
		"/v1/billing/subscription/cancel",
		true
	],
	"billingResume": [
		"POST",
		"/v1/billing/subscription/resume",
		true
	],
	"billingCreatePortal": [
		"POST",
		"/v1/billing/portal",
		true
	],
	"billingListInvoices": [
		"GET",
		"/v1/billing/invoices",
		false
	],
	"parityListContactLists": [
		"GET",
		"/v1/parity/contact-lists",
		false
	],
	"parityCreateContactList": [
		"POST",
		"/v1/parity/contact-lists",
		true
	],
	"paritySetListMembers": [
		"PUT",
		"/v1/parity/contact-lists/:id/members",
		false
	],
	"parityDeleteContactList": [
		"DELETE",
		"/v1/parity/contact-lists/:id",
		false
	],
	"parityListReminders": [
		"GET",
		"/v1/parity/contact-reminders",
		false
	],
	"parityCreateReminder": [
		"POST",
		"/v1/parity/contact-reminders",
		true
	],
	"parityDeleteReminder": [
		"DELETE",
		"/v1/parity/contact-reminders/:id",
		false
	],
	"contactsListFieldDefs": [
		"GET",
		"/v1/contacts/field-definitions",
		false
	],
	"contactsCreateFieldDef": [
		"POST",
		"/v1/contacts/field-definitions",
		true
	],
	"contactsDeleteFieldDef": [
		"DELETE",
		"/v1/contacts/field-definitions/:id",
		false
	],
	"contactsListViews": [
		"GET",
		"/v1/contacts/views",
		false
	],
	"contactsCreateView": [
		"POST",
		"/v1/contacts/views",
		true
	],
	"contactsDeleteView": [
		"DELETE",
		"/v1/contacts/views/:id",
		false
	],
	"contactsCreateSmartList": [
		"POST",
		"/v1/contacts/smart-lists",
		true
	],
	"contactsGetSettings": [
		"GET",
		"/v1/contacts/settings",
		false
	],
	"contactsPutSettings": [
		"PUT",
		"/v1/contacts/settings",
		false
	],
	"contactsListAutomations": [
		"GET",
		"/v1/contacts/automations",
		false
	],
	"contactsCreateAutomation": [
		"POST",
		"/v1/contacts/automations",
		true
	],
	"contactsDeleteAutomation": [
		"DELETE",
		"/v1/contacts/automations/:id",
		false
	],
	"contactsCard": [
		"GET",
		"/v1/contacts/card",
		false
	],
	"contactsFocus": [
		"GET",
		"/v1/contacts/focus",
		false
	],
	"contactsRotateIntakeToken": [
		"POST",
		"/v1/contacts/settings/intake-token",
		true
	],
	"contactsFormIntake": [
		"POST",
		"/v1/contacts/intake/:token",
		false
	],
	"contactsListOpportunities": [
		"GET",
		"/v1/opportunities",
		false
	],
	"contactsCreateOpportunity": [
		"POST",
		"/v1/opportunities",
		true
	],
	"contactsUpdateOpportunity": [
		"PATCH",
		"/v1/opportunities/:id",
		false
	],
	"contactsDeleteOpportunity": [
		"DELETE",
		"/v1/opportunities/:id",
		false
	],
	"contactsList": [
		"GET",
		"/v1/contacts",
		false
	],
	"contactsCreate": [
		"POST",
		"/v1/contacts",
		true
	],
	"contactsListTags": [
		"GET",
		"/v1/contacts/tags",
		false
	],
	"contactsListDuplicates": [
		"GET",
		"/v1/contacts/duplicates",
		false
	],
	"contactsExportCsv": [
		"GET",
		"/v1/contacts/export",
		false
	],
	"contactsImportCsv": [
		"POST",
		"/v1/contacts/import",
		true
	],
	"contactsGet": [
		"GET",
		"/v1/contacts/:id",
		false
	],
	"contactsHistory": [
		"GET",
		"/v1/contacts/:id/bookings",
		false
	],
	"contactsUpdate": [
		"PATCH",
		"/v1/contacts/:id",
		false
	],
	"contactsDelete": [
		"DELETE",
		"/v1/contacts/:id",
		false
	],
	"contactsMerge": [
		"POST",
		"/v1/contacts/:id/merge",
		true
	],
	"contactsBookingLinks": [
		"GET",
		"/v1/contacts/:id/booking-links",
		false
	],
	"contactsGdprExport": [
		"GET",
		"/v1/contacts/:id/gdpr-export",
		false
	],
	"contactsErase": [
		"POST",
		"/v1/contacts/:id/erase",
		true
	],
	"parityCreateGroupLink": [
		"POST",
		"/v1/parity/group-links",
		true
	],
	"getGroupLinkSettings": [
		"GET",
		"/v1/links/group-settings",
		false
	],
	"putGroupLinkSettings": [
		"PUT",
		"/v1/links/group-settings",
		false
	],
	"listLinks": [
		"GET",
		"/v1/links",
		false
	],
	"createLink": [
		"POST",
		"/v1/links",
		true
	],
	"createOneOffLink": [
		"POST",
		"/v1/links/one-off",
		true
	],
	"listLinkableEventTypes": [
		"GET",
		"/v1/links/event-types",
		false
	],
	"getLinksFreeSlots": [
		"GET",
		"/v1/links/free-slots",
		false
	],
	"getHolidaySettings": [
		"GET",
		"/v1/links/holidays",
		false
	],
	"putHolidaySettings": [
		"PUT",
		"/v1/links/holidays",
		false
	],
	"previewHolidays": [
		"GET",
		"/v1/links/holidays/preview",
		false
	],
	"getLink": [
		"GET",
		"/v1/links/:id",
		false
	],
	"revokeLink": [
		"DELETE",
		"/v1/links/:id",
		false
	],
	"getPublicLink": [
		"GET",
		"/v1/public/links/:token",
		false
	],
	"getPublicLinkSlots": [
		"GET",
		"/v1/public/links/:token/slots",
		false
	],
	"createPublicLinkBooking": [
		"POST",
		"/v1/public/links/:token/bookings",
		true
	],
	"adminGetMe": [
		"GET",
		"/v1/admin/me",
		false
	],
	"adminListTenants": [
		"GET",
		"/v1/admin/tenants",
		false
	],
	"adminGetTenant": [
		"GET",
		"/v1/admin/tenants/:id",
		false
	],
	"adminSuspendTenant": [
		"POST",
		"/v1/admin/tenants/:id/suspend",
		true
	],
	"adminUnsuspendTenant": [
		"POST",
		"/v1/admin/tenants/:id/unsuspend",
		true
	],
	"adminSetFeatureFlag": [
		"PUT",
		"/v1/admin/tenants/:id/flags/:flag",
		false
	],
	"adminDeleteFeatureFlag": [
		"DELETE",
		"/v1/admin/tenants/:id/flags/:flag",
		false
	],
	"adminImpersonate": [
		"POST",
		"/v1/admin/impersonations",
		true
	],
	"adminGetImpersonation": [
		"GET",
		"/v1/admin/impersonation",
		false
	],
	"adminEndImpersonation": [
		"POST",
		"/v1/admin/impersonation/end",
		true
	],
	"adminGetHealth": [
		"GET",
		"/v1/admin/health",
		false
	],
	"adminListFailedJobs": [
		"GET",
		"/v1/admin/jobs/failed",
		false
	],
	"adminRetryJob": [
		"POST",
		"/v1/admin/jobs/:id/retry",
		true
	],
	"adminDiscardJob": [
		"DELETE",
		"/v1/admin/jobs/:id",
		false
	],
	"adminListAnnouncements": [
		"GET",
		"/v1/admin/announcements",
		false
	],
	"adminCreateAnnouncement": [
		"POST",
		"/v1/admin/announcements",
		true
	],
	"adminDeleteAnnouncement": [
		"DELETE",
		"/v1/admin/announcements/:id",
		false
	],
	"adminActiveAnnouncements": [
		"GET",
		"/v1/announcements",
		false
	],
	"listNotifyNotifications": [
		"GET",
		"/v1/notify/notifications",
		false
	],
	"getNotifyUnreadCount": [
		"GET",
		"/v1/notify/notifications/unread-count",
		false
	],
	"markNotifyRead": [
		"POST",
		"/v1/notify/notifications/:id/read",
		true
	],
	"markNotifyAllRead": [
		"POST",
		"/v1/notify/notifications/read-all",
		true
	],
	"getNotifyPreferences": [
		"GET",
		"/v1/notify/preferences",
		false
	],
	"putNotifyPreferences": [
		"PUT",
		"/v1/notify/preferences",
		false
	],
	"getNotifyPushConfig": [
		"GET",
		"/v1/notify/push",
		false
	],
	"subscribeNotifyPush": [
		"POST",
		"/v1/notify/push/subscriptions",
		true
	],
	"subscribeNotifyNativePush": [
		"POST",
		"/v1/notify/push/native",
		true
	],
	"unsubscribeNotifyPush": [
		"POST",
		"/v1/notify/push/unsubscribe",
		true
	],
	"testNotifyPush": [
		"POST",
		"/v1/notify/push/test",
		true
	],
	"marketingSubmitContact": [
		"POST",
		"/v1/public/marketing/contact",
		false
	],
	"marketingGetOnboarding": [
		"GET",
		"/v1/onboarding",
		false
	],
	"marketingPutOnboarding": [
		"PUT",
		"/v1/onboarding",
		false
	],
	"accountsGetOrganizationPolicy": [
		"GET",
		"/v1/organization/policy",
		false
	],
	"accountsPutOrganizationPolicy": [
		"PUT",
		"/v1/organization/policy",
		false
	],
	"accountsLoginEmailCode": [
		"POST",
		"/v1/auth/login/email-code",
		false
	],
	"accountsSocialProviders": [
		"GET",
		"/v1/auth/social/providers",
		false
	],
	"accountsSocialStart": [
		"POST",
		"/v1/auth/social/start",
		false
	],
	"accountsSocialLogin": [
		"POST",
		"/v1/auth/social/login",
		false
	],
	"accountsSocialPortalLogin": [
		"POST",
		"/v1/auth/social/portal",
		false
	],
	"accountsTeamsLogin": [
		"POST",
		"/v1/auth/teams/login",
		false
	],
	"accountsSocialLinkStart": [
		"POST",
		"/v1/auth/social/link",
		true
	],
	"accountsSocialLink": [
		"POST",
		"/v1/auth/social/link/finish",
		true
	],
	"accountsListSocialIdentities": [
		"GET",
		"/v1/account/social",
		false
	],
	"accountsUnlinkSocialIdentity": [
		"DELETE",
		"/v1/account/social/:id",
		false
	],
	"accountsListSecondaryEmails": [
		"GET",
		"/v1/account/emails",
		false
	],
	"accountsAddSecondaryEmail": [
		"POST",
		"/v1/auth/secondary-emails",
		true
	],
	"accountsResendSecondaryEmail": [
		"POST",
		"/v1/auth/secondary-emails/:id/resend",
		true
	],
	"accountsVerifySecondaryEmail": [
		"POST",
		"/v1/auth/secondary-emails/verify",
		false
	],
	"accountsDeleteSecondaryEmail": [
		"DELETE",
		"/v1/account/emails/:id",
		false
	],
	"accountsGet": [
		"GET",
		"/v1/account",
		false
	],
	"accountsVerifyEmail": [
		"POST",
		"/v1/auth/verify-email",
		false
	],
	"accountsResendVerification": [
		"POST",
		"/v1/auth/verify-email/resend",
		true
	],
	"accountsRequestPasswordReset": [
		"POST",
		"/v1/auth/password-reset",
		false
	],
	"accountsResetPassword": [
		"POST",
		"/v1/auth/password-reset/confirm",
		false
	],
	"accountsChangePassword": [
		"POST",
		"/v1/auth/password",
		true
	],
	"accountsRequestEmailChange": [
		"POST",
		"/v1/auth/email-change",
		true
	],
	"accountsConfirmEmailChange": [
		"POST",
		"/v1/auth/email-change/confirm",
		false
	],
	"accountsLoginTwoFactor": [
		"POST",
		"/v1/auth/login/two-factor",
		false
	],
	"accountsTwoFactorSetup": [
		"POST",
		"/v1/auth/two-factor/setup",
		true
	],
	"accountsTwoFactorEnable": [
		"POST",
		"/v1/auth/two-factor/enable",
		true
	],
	"accountsTwoFactorDisable": [
		"POST",
		"/v1/auth/two-factor/disable",
		true
	],
	"accountsDeleteAccount": [
		"POST",
		"/v1/auth/delete-account",
		true
	],
	"accountsSetOrganizationSecurity": [
		"PUT",
		"/v1/organization/security",
		false
	],
	"accountsTransferOwnership": [
		"POST",
		"/v1/auth/transfer-ownership",
		true
	]
};
// packages/sdk/src/index.ts
var SDK_VERSION = "0.1.0";
var RETRY_STATUS = /* @__PURE__ */ new Set([
	429,
	502,
	503,
	504
]);
var MAX_DELAY_MS = 3e4;
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function retryDelayMs(attempt, baseMs, retryAfter) {
	if (retryAfter !== void 0) return Math.min(retryAfter * 1e3, MAX_DELAY_MS);
	return Math.random() * Math.min(baseMs * 2 ** attempt, MAX_DELAY_MS);
}
function queryString(query) {
	const qs = new URLSearchParams();
	for (const [k, v] of Object.entries(query ?? {})) {
		if (v === void 0 || v === null) continue;
		if (Array.isArray(v)) for (const item of v) qs.append(k, String(item));
		else qs.set(k, String(v));
	}
	return qs.size ? `?${qs}` : "";
}
var hasHeader = (headers, name) => Object.keys(headers).some((k) => k.toLowerCase() === name);
function toApiError(res, text) {
	let json;
	try {
		json = text ? JSON.parse(text) : void 0;
	} catch {}
	const retry = Number(res.headers.get("retry-after"));
	const requestId = res.headers.get("x-request-id") ?? void 0;
	const retryAfter = res.headers.has("retry-after") && Number.isFinite(retry) ? retry : void 0;
	const e = json?.error;
	if (typeof e?.code === "string" && typeof e.message === "string") return apiErrorFor(res.status, e.code, e.message, e.details, requestId, retryAfter);
	return apiErrorFor(res.status, "http_error", res.statusText || `HTTP ${res.status}`, text, requestId, retryAfter);
}
/** One method per API operation. */
function createClient(opts) {
	const doFetch = opts.fetch ?? globalThis.fetch;
	const base = opts.baseUrl.replace(/\/+$/, "");
	const { maxRetries = 2, timeoutMs = 3e4, retryBaseMs = 300 } = opts;
	const client = {};
	for (const [op, [method, routePath, idempotent]] of Object.entries(routeTable)) client[op] = async (input = {}) => {
		const path = routePath.replace(/:(\w+)/g, (_, k) => {
			const v = input.params?.[k];
			if (v === void 0) throw new TypeError(`${op}: missing path param "${k}"`);
			return encodeURIComponent(String(v));
		});
		const headers = { accept: "application/json" };
		if (opts.token) {
			headers["authorization"] = `Bearer ${opts.token}`;
			headers["x-calendoro-sdk"] = `typescript/${SDK_VERSION}`;
		}
		if (input.body !== void 0) headers["content-type"] = "application/json";
		Object.assign(headers, input.headers);
		if (idempotent && !hasHeader(headers, "idempotency-key")) headers["idempotency-key"] = crypto.randomUUID();
		const repeatable = method === "GET" || method === "PUT" || method === "DELETE" || idempotent;
		const url = `${base}${path}${queryString(input.query)}`;
		for (let attempt = 0;; attempt++) {
			let res;
			const timeout = AbortSignal.timeout(timeoutMs);
			try {
				res = await doFetch(url, {
					method,
					headers,
					signal: input.signal ? AbortSignal.any([input.signal, timeout]) : timeout,
					...input.body !== void 0 ? { body: JSON.stringify(input.body) } : {}
				});
			} catch (e) {
				if (input.signal?.aborted) throw new NetworkError(`${op}: aborted`, void 0, { cause: e });
				if (repeatable && attempt < maxRetries) {
					await sleep(retryDelayMs(attempt, retryBaseMs, void 0));
					continue;
				}
				if (timeout.aborted) throw new TimeoutError(`${op}: no response within ${timeoutMs} ms`, void 0, { cause: e });
				throw new NetworkError(`${op}: ${e instanceof Error ? e.message : "network error"}`, void 0, { cause: e });
			}
			const text = await res.text();
			if (!res.ok) {
				const err = toApiError(res, text);
				if (RETRY_STATUS.has(res.status) && attempt < maxRetries && (repeatable || res.status === 429)) {
					await sleep(retryDelayMs(attempt, retryBaseMs, err instanceof RateLimitError ? err.retryAfter : void 0));
					continue;
				}
				throw err;
			}
			let json;
			try {
				json = text ? JSON.parse(text) : void 0;
			} catch {
				json = text;
			}
			if (!opts.validateResponse) return json;
			try {
				return opts.validateResponse(op, json);
			} catch (e) {
				throw new ResponseValidationError(`${op}: the response did not pass validateResponse`, res.headers.get("x-request-id") ?? void 0, { cause: e });
			}
		}
	};
	return client;
}
/**
* Walks every page of a list, one item at a time, fetching more only as you go.
* `for await (const b of paginate(api, "listBookings", { query: { status: "confirmed" } })) { ... }`
*/
async function* paginate(client, op, input) {
	const raw = input ?? {};
	const call = client[op];
	let cursor = raw.query?.["cursor"];
	for (;;) {
		const page = await call({
			...raw,
			query: {
				...raw.query,
				...cursor === void 0 ? {} : { cursor }
			}
		});
		yield* page.data;
		if (!page.nextCursor) return;
		cursor = page.nextCursor;
	}
}
export { ApiError, AuthenticationError, CalendoroError, ConflictError, NetworkError, NotFoundError, PermissionError, RateLimitError, ResponseValidationError, SDK_VERSION, ServerError, TimeoutError, ValidationError, apiErrorFor, createClient, paginate };
