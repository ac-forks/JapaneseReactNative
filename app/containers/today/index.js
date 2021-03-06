import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Platform, StyleSheet, View } from 'react-native';

import { iOSColors } from 'react-native-typography';
import store from 'react-native-simple-store';
import Tts from 'react-native-tts';

import { cleanWord, shuffle } from '../../utils/helpers';

import OutOfConnection from './components/out-of-connection';

import AdMob from '../../components/admob';
import Card from '../../components/card';
import CardOptionSelector from '../../components/card-option-selector';
import CustomButton from '../../components/button';
import SoundButton from '../../components/sound-button';

import I18n from '../../utils/i18n';
import tracker from '../../utils/tracker';

import { config } from '../../config';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  card: {
    flex: 1,
    borderRadius: 10,
    borderColor: iOSColors.lightGray,
    borderWidth: 1,
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 10,
    paddingTop: 60,
  },
  text: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: iOSColors.black,
    backgroundColor: 'transparent',
    lineHeight: 40,
  },
  thinText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '300',
    color: iOSColors.black,
    backgroundColor: 'transparent',
    lineHeight: 40,
  },
  footer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
});

type Props = {};
export default class Today extends Component<Props> {
  static navigationOptions = {
    title: I18n.t('app.today.title'),
  };

  static propTypes = {
    navigation: PropTypes.shape({}).isRequired,
  };

  state = {
    isKanaShown: false,
    isKanjiShown: false,
    isRomajiShown: false,
    isTranslationShown: false,
    isSoundOn: false,

    todayItems: [],
    outOfConnection: false,

    cardIndex: 0,
    isPremium: false,
  };

  componentDidMount() {
    store
      .get('notFirstStart')
      .then(notFirstStart => {
        if (notFirstStart) {
          store
            .get('isKanaShown')
            .then(isKanaShown => this.setState({ isKanaShown }));
          store
            .get('isKanjiShown')
            .then(isKanjiShown => this.setState({ isKanjiShown }));
          store
            .get('isRomajiShown')
            .then(isRomajiShown => this.setState({ isRomajiShown }));
          store
            .get('isTranslationShown')
            .then(isTranslationShown => this.setState({ isTranslationShown }));
          store
            .get('isSoundOn')
            .then(isSoundOn => this.setState({ isSoundOn }));
        } else {
          this.setState({
            isKanaShown: true,
            isKanjiShown: true,
            isRomajiShown: true,
            isTranslationShown: true,
            isSoundOn: true,
          });
        }
      })
      .then(() => this.requestTodayItems());

    store.get('isPremium').then(isPremium => this.setState({ isPremium }));
  }

  componentWillUnmount() {
    Tts.stop();
  }

  updateStates = (
    isKanjiShown,
    isKanaShown,
    isRomajiShown,
    isTranslationShown,
    isSoundOn
  ) => {
    console.log(
      'updateStates',
      isKanjiShown,
      isKanaShown,
      isRomajiShown,
      isTranslationShown,
      isSoundOn
    );
    this.setState({
      isKanjiShown,
      isKanaShown,
      isRomajiShown,
      isTranslationShown,
      isSoundOn,
    });
  };

  requestTodayItems() {
    const { isSoundOn } = this.state;

    const URL = `${config.server}/today`;
    console.log('Call', URL);
    fetch(URL)
      .then(res => res.json())
      .then(
        results => results.data && this.setState({ todayItems: results.data })
      )
      .then(() => {
        const { todayItems } = this.state;

        if (todayItems.length > 0) {
          this.setState({
            outOfConnection: false,
          });

          if (isSoundOn) {
            Tts.stop();
            Tts.setDefaultLanguage('ja');
            Tts.speak(cleanWord(todayItems[0].kana));
            tracker.logEvent('app-action-today-read');
          }
        } else {
          this.setState({
            outOfConnection: true,
          });
        }
      })
      .catch(err => {
        console.log('Request for aqi failed', err);
        this.setState({
          outOfConnection: true,
        });
        tracker.logEvent('app-action-today-out-of-connection');
      });
  }

  render() {
    const { navigation } = this.props;

    const { isPremium } = this.state;

    console.log('isPremium', isPremium);

    const {
      todayItems,
      cardIndex,
      isKanjiShown,
      isKanaShown,
      isRomajiShown,
      isTranslationShown,
      isSoundOn,
      outOfConnection,
    } = this.state;

    const card = todayItems.length > 0 ? todayItems[cardIndex] : null;

    return (
      <View style={styles.container}>
        <CardOptionSelector
          isOrderedEnable={false}
          onUpdate={this.updateStates}
        />

        <View style={{ flex: 1, paddingHorizontal: 26, paddingBottom: 30 }}>
          {outOfConnection && (
            <OutOfConnection
              onPress={() => {
                this.requestTodayItems();
                tracker.logEvent('user-action-today-reconnect');
              }}
            />
          )}
          {!outOfConnection &&
            card && (
              <Card
                navigation={navigation}
                lesson={card.lesson}
                kanji={card.kanji}
                kana={card.kana}
                romaji={card.romaji}
                translation={I18n.t(`minna.${card.lesson}.${card.romaji}`)}
                isKanjiShown={isKanjiShown}
                isKanaShown={isKanaShown}
                isRomajiShown={isRomajiShown}
                isTranslationShown={isTranslationShown}
              />
            )}
        </View>

        <View style={styles.footer}>
          <CustomButton
            raised
            onPress={() => {
              if (todayItems && todayItems.length > 0) {
                this.setState({ todayItems: shuffle([...todayItems]) }, () => {
                  if (isSoundOn) {
                    const { todayItems: newTodayItems } = this.state;

                    Tts.stop();
                    Tts.setDefaultLanguage('ja');
                    Tts.speak(cleanWord(newTodayItems[0].kana));
                    tracker.logEvent('app-action-today-shuffle-read');
                  }
                });
                tracker.logEvent('user-action-today-shuffle');
              }
            }}
            title={I18n.t('app.today.shuffle')}
            titleStyles={{ fontSize: 20 }}
          />

          <SoundButton
            containerStyles={{ marginHorizontal: 15 }}
            onPress={() => {
              if (todayItems && todayItems.length > 0) {
                Tts.setDefaultLanguage('ja');
                Tts.speak(cleanWord(todayItems[cardIndex].kana));
                tracker.logEvent('user-action-today-read');
              }
            }}
          />

          <CustomButton
            raised
            onPress={() => {
              if (todayItems && todayItems.length > 0) {
                const isLast = cardIndex === todayItems.length - 1;
                this.setState({ cardIndex: isLast ? 0 : cardIndex + 1 }, () => {
                  if (isSoundOn) {
                    Tts.setDefaultLanguage('ja');
                    Tts.speak(
                      cleanWord(todayItems[isLast ? 0 : cardIndex + 1].kana)
                    );
                    tracker.logEvent('app-action-today-next-read');
                  }
                });
                tracker.logEvent('user-action-today-next');
              }
            }}
            title={I18n.t('app.common.next')}
            titleStyles={{ fontSize: 20 }}
          />
        </View>

        {!isPremium && (
          <AdMob
            unitId={config.admob[`japanese-${Platform.OS}-today-banner`]}
          />
        )}
      </View>
    );
  }
}
