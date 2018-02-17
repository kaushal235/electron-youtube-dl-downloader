var $ = require('jquery');
var spawn = require('child_process').spawn;

$(document).ready(function() {
  var storagePath = window.localStorage.getItem('path');
  $('#download-form').submit(function(e) {
    e.preventDefault();
    var url = $('#url').val();
    getQuality(url);
  });

  $('#quality-select-form').submit(function (e) {
    e.preventDefault();
    var url = $('#url').val();
    var audioQuality = $('#audio-option').val();
    var videoQuality = $('#video-option').val();
    downloadVideo(url, videoQuality, audioQuality);
  });

  $('#clear-btn').click(function () {
    qualityShowUi(false);
  });

  if(storagePath){
    $('#store_file_label').html(storagePath);
  }

  $('#store_file').change(function (e) {
    var path = e.target.files[0].path;
    window.localStorage.setItem('path', path);
  });

  $('.nav-group-item').click(function (e) {
      $(this).addClass('active').siblings().removeClass('active');
      $('.page').addClass('hidden');
      var target = $(this).attr('data-target');
      $(target).removeClass('hidden');
  });

});

function isVideo(str) {
  return str.indexOf('video') >= 0
}

function isAudio(str) {
  return str.indexOf('audio') >= 0
}

function qualityShowUi(flag) {
    var urlInput = $('#url');
    var okButton = $('#get-quality-btn');

    var qualitySelectForm = $('#quality-select-form');

    if(flag) {
      qualitySelectForm.removeClass('hidden').show();
      urlInput.attr('readonly', true);
      okButton.attr('disabled', true);
    } else {
      qualitySelectForm.hide();
      urlInput.val('');
      urlInput.attr('readonly', false);
      okButton.attr('disabled', false);
    }

}

function dropDownOption(items) {
  var dropdowns = '';
  items.forEach(function(v) {
    dropdowns += `<option value=${v[0]}>${v[1]}</option>`;
  });
  return dropdowns;
}


function getQuality(url) {
  console.log('youtube-dl', ['-F', url]);
  var child = spawn('youtube-dl', ['-F', url]);
  child.stdout.on('data', function(chunk) {
    parseQualityResult(chunk);
  });
}

function parseQualityResult(chunk) {
  var dataString = chunk.toString();
  var isValid = dataString.indexOf('resolution note');
  if (isValid < 0) {
    return false;
  }

  var formatsString = dataString.split('resolution note')[1];
  var formatList = formatsString.split('\n');
  var format = {}
  formatList.forEach(function(v) {
    if (!v)
      return;
    var formatName = v.trim().replace(/ +/g, '-').split('-');
    var key = formatName.shift();
    var value = formatName.toString();
    format[key] = value.replace(/,/g,' ').replace(/\s+/,' ')
  });

  renderDropDown(format);
}

function downloadVideo(url, video, audio) {
  var storagePath = window.localStorage.getItem('path');
  var option = ['-f', `${video}+${audio}`, url];
  if(storagePath) {
    option.push('--o');
    option.push(`${storagePath}/%(title)s.%(ext)s`)
  }
  var child = spawn('youtube-dl', option);
  child.stdout.on('data', function(chunk) {
    downloadProgress(chunk);
  });
}

function downloadProgress(chunk) {
  var dataString = chunk.toString();
  console.log(dataString);
}


function renderDropDown(format) {
  console.log(format);
  var videoOption = [];
  var audioOption = [];
  for (var key in format) {
    value = format[key];
    if (isVideo(value)) {
      videoOption.push([key, value]);
    } else if (isAudio(value)) {
      audioOption.push([key, value]);
    } else {
      console.log('ignore audio/video combine');
    }
  }

  var audioOptionSelector = $('#audio-option');
  var videoOptionSelector = $('#video-option');

  audioOptionSelector.html(dropDownOption(audioOption));
  videoOptionSelector.html(dropDownOption(videoOption));
  qualityShowUi(true);
}
