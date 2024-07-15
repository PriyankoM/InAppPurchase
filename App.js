import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, FlatList, SafeAreaView } from 'react-native';
import RNIap, {
  initConnection,
  getSubscriptions,
  requestSubscription,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  validateReceiptIos,
  clearTransactionIOS
} from 'react-native-iap';

const subscriptionProductIds = ['test_subscription_id1', 'test_subscription_id2']; 

const App = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    const initIAP = async () => {
      try {
        await initConnection();
        const subscriptions = await getSubscriptions(subscriptionProductIds);
        setSubscriptions(subscriptions);
        await checkSubscriptionStatus();
      } catch (err) {
        console.warn(err);
      }
    };

    initIAP();

    const purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
      const receipt = purchase.transactionReceipt;
      if (receipt) {
        try {
          await finishTransaction(purchase);
          await validateReceipt(receipt);
          Alert.alert('Purchase Successful', 'Thank you for your purchase.');
        } catch (error) {
          console.warn(error);
        }
      }
    });

    const purchaseErrorSubscription = purchaseErrorListener((error) => {
      Alert.alert('Purchase Failed', error.message);
      console.warn('purchaseErrorListener', error);
    });

    return () => {
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
    };
  }, []);

  const handleSubscription = async (productId) => {
    try {
      await requestSubscription(productId);
    } catch (err) {
      console.warn(err);
    }
  };

  const validateReceipt = async (receipt) => {
    try {
      const result = await validateReceiptIos({
        'receipt-data': receipt,
        'password': 'shared_secret', 
      });

      
      if (result.status === 0) {
        const latestReceiptInfo = result.latest_receipt_info;
        if (latestReceiptInfo) {
          const expirationDate = new Date(
            latestReceiptInfo.expires_date_ms
          ).toISOString();
          setSubscriptionStatus({
            isSubscribed: true,
            expirationDate: expirationDate,
          });
        }
      }
    } catch (error) {
      console.warn('Receipt validation failed', error);
    }
  };

  

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Available Subscriptions</Text>
      <FlatList
        data={subscriptions}
        keyExtractor={(item) => item.productId}
        renderItem={({ item }) => (
          <View style={{ margin: 10 }}>
            <Text>{item.title}</Text>
            <Text>{item.description}</Text>
            <Text>{item.localizedPrice}</Text>
            <Button title="Subscribe" onPress={() => handleSubscription(item.productId)} />
          </View>
        )}
      />
      {subscriptionStatus && subscriptionStatus.isSubscribed ? (
        <Text>Subscription active until: {subscriptionStatus.expirationDate}</Text>
      ) : (
        <Text>No active subscription</Text>
      )}
    </SafeAreaView>
  );
};

export default App;
