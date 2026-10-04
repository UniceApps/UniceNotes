Pod::Spec.new do |s|
  s.name           = 'WebSession'
  s.version        = '1.0.0'
  s.summary        = 'Persistance des cookies du navigateur intégré'
  s.description    = 'Garde les cookies de session de WKWebView entre deux lancements de UniceNotes'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'WebKit'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
