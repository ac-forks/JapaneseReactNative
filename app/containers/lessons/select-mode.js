import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Alert, ScrollView, Platform, StyleSheet, View } from 'react-native';

import { iOSColors } from 'react-native-typography';
import store from 'react-native-simple-store';

import AdMob from '../../components/admob';
import ModeItem from './components/mode-item';

import I18n from '../../utils/i18n';
import tracker from '../../utils/tracker';

import { config } from '../../config';

const FIRST_FREE_LESSONS = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  tabIndicatorText: {
    ...Platform.select({
      ios: {
        fontSize: 16,
      },
      android: {
        fontSize: 12,
      },
    }),
    paddingBottom: 6,
    color: iOSColors.gray,
  },
  tabIndicatorSelectedText: {
    ...Platform.select({
      ios: {
        fontSize: 16,
      },
      android: {
        fontSize: 12,
      },
    }),
    paddingBottom: 6,
    color: iOSColors.tealBlue,
  },
});

type Props = {};
export default class SelectMode extends Component<Props> {
  static navigationOptions = ({ navigation }) => {
    const params = navigation.state.params || {};

    return {
      title: I18n.t('app.common.lesson_no', { lesson_no: params.item }),
      headerBackTitle: null,
    };
  };

  static propTypes = {
    navigation: PropTypes.shape({}).isRequired,
  };

  state = {
    isPremium: false,
  };

  componentDidMount() {
    store.get('isPremium').then(isPremium => this.setState({ isPremium }));
  }

  gotoLockFeature = (lockFeature, item) => {
    // lockFeature: assessment-listening, assessment-mc, read-all
    if (
      ['assessment-listening', 'assessment-mc', 'read-all'].indexOf(
        lockFeature
      ) === -1
    ) {
      return false;
    }

    const { navigation } = this.props;

    const { isPremium } = this.state;

    if (isPremium || item <= FIRST_FREE_LESSONS) {
      navigation.navigate(lockFeature, { lesson: item });
      tracker.logEvent(`user-action-goto-${lockFeature}`, {
        lesson: `${item}`,
      });
    } else {
      tracker.logEvent(`app-action-${lockFeature}-premium-required`, {
        lesson: `${item}`,
      });

      Alert.alert(
        I18n.t('app.read-all.premium-required-title'),
        I18n.t('app.read-all.premium-required-description'),
        [
          {
            text: 'Cancel',
            onPress: () => {
              console.log('Cancel Pressed');
              tracker.logEvent(`user-action-${lockFeature}-premium`, {
                lesson: `${item}`,
                interest: false,
              });
            },
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('about');
              tracker.logEvent(`user-action-${lockFeature}-premium`, {
                lesson: `${item}`,
                interest: true,
              });
            },
          },
        ],
        { cancelable: false }
      );
    }
  };

  gotoAssessment = item => {
    const { navigation } = this.props;
    navigation.navigate('assessment', { lesson: item });
    tracker.logEvent('user-action-goto-assessment', {
      lesson: `${item}`,
    });
  };

  render() {
    const {
      navigation,
      navigation: {
        state: {
          params: { item },
        },
      },
    } = this.props;

    const { isPremium } = this.state;

    return (
      <View style={styles.container}>
        <ScrollView>
          <ModeItem
            title={I18n.t('app.vocab-list.vocab')}
            onPress={() => {
              navigation.navigate('vocab-list', { item });
              tracker.logEvent('user-action-goto-vocab-list', {
                lesson: `${item}`,
              });
            }}
          />
          <ModeItem
            title={I18n.t('app.vocab-list.learn')}
            onPress={() => this.gotoAssessment(item)}
          />
          <ModeItem
            title={I18n.t('app.vocab-list.quiz')}
            onPress={() => this.gotoLockFeature('assessment-mc', item)}
            isRequirePremium={item > FIRST_FREE_LESSONS}
            isUnlocked={isPremium}
            navigation={this.props.navigation}
          />
          <ModeItem
            title={I18n.t('app.vocab-list.listening')}
            onPress={() => this.gotoLockFeature('assessment-listening', item)}
            isRequirePremium={item > FIRST_FREE_LESSONS}
            isUnlocked={isPremium}
            navigation={this.props.navigation}
          />
          <ModeItem
            title={I18n.t('app.vocab-list.read-all')}
            onPress={() => this.gotoLockFeature('read-all', item)}
            isRequirePremium={item > FIRST_FREE_LESSONS}
            isUnlocked={isPremium}
            navigation={this.props.navigation}
          />
        </ScrollView>

        {!isPremium && (
          <AdMob
            unitId={config.admob[`japanese-${Platform.OS}-lessons-banner`]}
          />
        )}
      </View>
    );
  }
}
