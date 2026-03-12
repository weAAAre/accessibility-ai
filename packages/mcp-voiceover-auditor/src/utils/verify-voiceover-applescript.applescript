on isVoiceOverRunningWithAppleScript()
	set isRunning to true
	-- is AppleScript enabled on VoiceOver --
	tell application "VoiceOver"
		try
			set x to bounds of vo cursor
		on error
			set isRunning to false
		end try
	end tell
	return isRunning
end isVoiceOverRunningWithAppleScript

isVoiceOverRunningWithAppleScript()
