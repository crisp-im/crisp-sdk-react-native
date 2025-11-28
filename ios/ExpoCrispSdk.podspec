require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoCrispSdk'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/VirtuozTM/expo-crisp-sdk' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'Crisp', '~> 2.12.0'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
