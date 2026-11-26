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
  s.swift_version  = '5.0'
  s.source         = { git: 'https://github.com/crisp-im/crisp-sdk-react-native.git', tag: "v#{s.version}" }
  s.static_framework = true
  s.platform       = :ios, '14.0'

  s.dependency 'ExpoModulesCore'
  s.dependency 'Crisp', '3.1.1'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "*.{h,m,mm,swift,hpp,cpp}"

  s.test_spec 'Migration' do |test|
    test.source_files = 'Tests/**/*.swift'
    test.libraries = 'c++'
  end
end
