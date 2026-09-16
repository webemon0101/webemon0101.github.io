function speak(){
    const spk   = new SpeechSynthesisUtterance();
    spk.text  = document.querySelector('.text').value;
    spk.rate  = 1; // 読み上げ速度 0.1-10 初期値:1 (倍速なら2, 半分の倍速なら0.5, )
    spk.pitch = 1;　// 声の高さ 0-2 初期値:1(0で女性の声) 
    spk.lang  = 'en-US'; //(日本語:ja-JP, アメリカ英語:en-US, イギリス英語:en-GB, 中国語:zh-CN, 韓国語:ko-KR)
    speechSynthesis.speak(spk)
  }
  function speaknow(serifu){
    const speak = new SpeechSynthesisUtterance();
    speak.text = serifu;
    speak.rate =1;
    speak.pitch =1;
    speak.lang = 'en-US'
    speechSynthesis.speak(speak);
  }

  function jspeak(){
    const spk   = new SpeechSynthesisUtterance();
    spk.text  = document.querySelector('.text').value;
    spk.rate  = 1; // 読み上げ速度 0.1-10 初期値:1 (倍速なら2, 半分の倍速なら0.5, )
    spk.pitch = 1;　// 声の高さ 0-2 初期値:1(0で女性の声) 
    spk.lang  = 'ja-JP'; //(日本語:ja-JP, アメリカ英語:en-US, イギリス英語:en-GB, 中国語:zh-CN, 韓国語:ko-KR)
    speechSynthesis.speak(spk)
  }
          
  function jspeaknow(serifu){
    const speak = new SpeechSynthesisUtterance();
    speak.text = serifu;
    speak.rate =1;
    speak.pitch =1;
    speak.lang = 'ja-JP'
    speechSynthesis.speak(speak);
  }

  function jspeaknow2(serifu){
    SpeechSynthesisUtterance = SpeechSynthesisUtterance || AVSpeechUtterance;
    const u = new window.SpeechSynthesisUtterance();
    u.text = serifu;
    u.rate = 1.0;
    u.lang = 'ja-JP';
    window.speechSynthesis.speak(u);
  }

  function multispeaknow(serifu, gengo){
  var speak = new SpeechSynthesisUtterance();
  speak.text = serifu;
  speak.rate =1;
  speak.pitch =1;
  speak.lang = gengo;
  speechSynthesis.speak(speak);
  }

        
