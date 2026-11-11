/**
 * Field checks shared by sign-up and the onboarding steps. They live in @hospio/ui/shared/validate (a plain module the
 * admin app's onboarding uses too) and match the API's checks, so the screen and the server refuse the same things.
 */
export {
	checkAddress,
	checkCity,
	checkEmail,
	checkName,
	checkPhone,
	only,
} from "@hospio/ui/shared/validate";
