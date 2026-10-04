Pod::Spec.new do |s|
  s.name           = 'ContentScroll'
  s.version        = '1.0.0'
  s.summary        = 'Liste principale des onglets'
  s.description    = 'Declare la ScrollView d un onglet a UIKit pour que iOS 26 reduise la barre d onglets au defilement'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
