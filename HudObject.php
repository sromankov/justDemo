<?php

class Model_Mapper_HudObject extends Core_Model_Mapper_Abstract
{
    const OBJECTS_PER_PAGE_AMOUNT   = 5;
    const HUD_TEMPLATE_PREFIX       = 'ha_';
    const ATTACHMENT_ASSETS_DIR = 'hud_attachments';

    const HUD_NOTIFICATION_SOURCE_FORUM              = 'forum_threads';
    const HUD_NOTIFICATION_SOURCE_VEHICLE            = 'show_vehicle';
    const HUD_NOTIFICATION_SOURCE_ALBUM              = 'albums';
    const HUD_NOTIFICATION_SOURCE_FRIENDS            = 'friends';

    const HUD_ACTION_FRIENDSHIP_ACCEPTED    = 'user_friendship_acc';
    const HUD_ACTION_RATE_ARTICLE           = 'rate_techarticles';
    const HUD_ACTION_REVIEW_TUTORIAL        = 'review_tutorials';
    const HUD_ACTION_REVIEW_WEBLINK         = 'review_weblinks';
    const HUD_ACTION_REVIEW_STICKY          = 'review_stickies';
    const HUD_ACTION_VEHICLE_IMAGE          = 'user_vehicle_image';


    protected $_dbTableClass = 'Model_DbTable_HudObject';
    protected $_modelClass = 'Model_HudObject';
    public $primaryKey = 'id';
    public $map = array(
        'id'                => 'hud_object_id',
        'post'              => 'hud_object_post',
        'referred_entity'   => 'hud_object_referred_entity',
        'referred_id'       => 'hud_object_referred_id',
        'owner_user_id'     => 'hud_object_owner_user_id',
        'poster_user_id'    => 'hud_object_poster_user_id',
        'poster_user_name'  => 'hud_object_poster_user_name',
        'created_date'      => 'hud_object_created_date',
        'is_deleted'        => 'hud_object_is_deleted',
        'action_id'         => 'hud_object_action_id',
        'owner'             => array(
                'model'         => 'Model_User',
                'pointKey'      => 'hud_object_owner_user_id',
                'refKey'        => 'user_id',
                'type'          => self::MODEL_RELATION_EXTEND,
                'options'       => array()
        ),
        'action'             => array(
            'model'         => 'Model_HudAction',
            'pointKey'      => 'hud_object_action_id',
            'refKey'        => 'hud_action_id',
            'type'          => self::MODEL_RELATION_EXTEND,
            'options'       => array()
        ),

        'poster'            => array(
                'model'         => 'Model_User',
                'pointKey'      => 'hud_object_poster_user_id',
                'refKey'        => 'user_id',
                'type'          => self::MODEL_RELATION_EXTEND,
                'options'       => array()
        ),
        'attachments'           => array(
                'model'         => 'Model_Hud_Attachments',
                'refKey'        => 'hud_object_id',
                'pointKey'      => 'hud_object_id',
                'type'          => self::MODEL_RELATION_HASMANY,
                'options'       => array()
        ),
        'statistics'        => array(
            'model'             => 'Model_Stats',
            'refKey'            => 'object_parent_id',
            'pointKey'          => 'hud_object_id',
            'type'              => self::MODEL_RELATION_EXTEND,
            'options'           => array('where' => array('object_parent_type_key = "hudobjects"')),
        )

    );

    /**
     * @static
     * @return Model_Mapper_HudObject
     */
    public static function getInstance()
    {
        return parent::getInstance();
    }


    public function getOneObject($objectId)
    {
        $select = $this->getDbTable()
            ->select()
            ->where($this->map['id'] . ' = ?', $objectId);
        $result = $this->fetchRow($select);
        return $result;
    }


    public function canWrite($userId, $hudOwnerId) {

        $settingName = Model_Mapper_Util_PrivacySetting::SETTING_USERS_HUD_NAME;
        return Model_Mapper_User_PrivacySetting::getInstance()->checkAccess($hudOwnerId, $userId, $settingName);

    }


    /**
     * @param int $from
     * @param int $hudOwnerId
     * @param int $visitorUserId
     *
     * @return Zend_Db_Table_Rowset_Abstract
     */
    public function getObjects($from = 0, $hudOwnerId = 0, $visitorUserId = null, $newonlyStamp = 0)
    {
        $hudOwnerId = intval($hudOwnerId);

        $amount = Model_Mapper_HudObject::OBJECTS_PER_PAGE_AMOUNT;



        // TODO privacy filter
        $dbTable = $this->getDbTable();
        $dbAdapter = $dbTable->getAdapter();
        $select = $dbAdapter
            ->select()
            ->from(array('ho' => $dbTable->info(Zend_Db_Table::NAME)))
            ->where($this->map['is_deleted'] . ' = ?', 0)
            ->order($this->map['created_date'] . ' DESC')
            ->limit($amount + 1, $from)
        ;

        if ($newonlyStamp > 0) {
            //$select->where('UNIX_TIMESTAMP(' . $this->map['created_date'] . ') > ?', $newonlyStamp);
            $select->where($this->map['created_date'] . ' > FROM_UNIXTIME(' .  $newonlyStamp . ')');
        }

        if ($hudOwnerId != 0) {
            // H.U.D.
            $select->where($this->map['owner_user_id'] . ' = ?', $hudOwnerId);
        } else {
            // NewsFeed
            if (null === $visitorUserId) {
                $select->having('privacyType = ?', Model_Mapper_User_PrivacySetting::TYPE_PUBLIC);
            } else {
                $select->joinLeft(
                    array('fs' => 'friendships'),
                    '((friendship_sender_id = ho.hud_object_owner_user_id AND friendship_receiver_id = ' . $visitorUserId . ')'
                        . ' OR (friendship_sender_id = ' . $visitorUserId . ' AND friendship_receiver_id = ho.hud_object_owner_user_id))'
                        . ' AND fs.friendship_status = \'' . Model_Mapper_Friendships::STATUS_ACTIVE . '\'',
                    array(
                        //'friendshipsSenderId' => 'friendship_sender_id',
                        //'friendshipsReceiverId' => 'friendship_receiver_id',
                        'isFriends' => 'IF(fs.friendship_id IS NULL, 0, 1)'
                    )
                );

                $utilPrivacySettingRow = Model_Mapper_Util_PrivacySetting::getInstance()->fetchRow(
                    array('util_privacy_setting_name = ?' => Model_Mapper_Util_PrivacySetting::SETTING_USERS_HUD_NAME)
                );


                $select->joinLeft(
                    array('userps' => 'user_privacy_settings'),
                    'userps.user_id = ho.hud_object_owner_user_id AND privacy_setting_id = ' . intval($utilPrivacySettingRow->id),
                    array(
                        'type' => "IF(userps.privacy_type IS NULL, 'public', userps.privacy_type)",
                    )
                );

                $select->having('isFriends = 1 AND type = ?', Model_Mapper_User_PrivacySetting::TYPE_FRIENDS);
                $select->orHaving('type = ?', Model_Mapper_User_PrivacySetting::TYPE_PUBLIC);
                $select->orHaving('hud_object_owner_user_id = ?', $visitorUserId);
            }
        }
        //echo $select;
        return $dbAdapter->fetchAll($select);
    }

    public function update($data)
    {
        try {
            parent::save($data);
        } catch (Exception $e) {
            return $e->getMessage();
        }
        return $data;
    }

    public function save($data)
    {

        try {
            $data['created_date'] = date("Y-m-d H:i:s");

            $object = $this->getModel();
            $object->setData($data);

            parent::save($object);

        } catch (Exception $e) {

            return $e->getMessage();
        }
        return $object;

    }



    /**
     * @param $action
     * @return Core_Model_Entity|Zend_Db_Table_Row_Abstract
     */
    public function GetHudAction($action) {

        $select = Model_Mapper_HudAction::getInstance()->getDbTable()
            ->select()
            ->where('hud_action_is_disabled = ?', 0)
            ->where('hud_action_name = ?', $action)
        ;

        $result = Model_Mapper_HudAction::getInstance()->fetchRow($select);

        return $result;

    }

    /**
     * @param int | string $posterId
     * @param int $ownerId
     * @param string $post
     * @param string $referredEntity
     * @param int $referredId
     * @param string $action
     * @param array $medias
     * @return bool
     */
    public function addHoodObject($posterId, $ownerId, $post, $referredEntity, $referredId, $action,  $mediaObject = null)
    {

        $poster = Model_Mapper_User::getInstance()->fetchRow(array('user_id=?' => $posterId));
        $owner  = Model_Mapper_User::getInstance()->fetchRow(array('user_id=?' => $ownerId));

        $ha = $this->GetHudAction($action);

        if ($ha) {
            if ($posterId > 0) {
                $posterName = $poster->username;
            }
            else {
                if ($posterId <= 0) {
                    $posterName = 'Unregistered';
                }
                else {
                    $posterName = $posterId;
                }
            }

            if ($owner) {
                $data = array();
                $data['post']               = $post;
                $data['poster_user_id']     = $posterId;
                $data['poster_user_name']   = $posterName;
                $data['owner_user_id']      = $ownerId;
                $data['action_id']          = $ha->id;

                $referredId = (int)$referredId;
                if ($referredEntity && $referredId) {
                    $data['referred_entity']  = $referredEntity;
                    $data['referred_id']      = $referredId;
                }
                $result  = $this->save($data);

                // TODO medias saving (for the H.U.D. publishing and galleries changing events)
                if (!is_null($mediaObject)) {
                    $id = $result->id;

                    $hudModel = Model_Mapper_HudObject::getInstance();
                    $hudModel->saveMedias($mediaObject, $id, $data['post']);

                }

                return $result;
            }
            return false;
        }
        else {
            return false;
        }

    }

    public static function getAttachmentsDirName($messageId)
    {
        return WWW_DIR . DS . 'assets' . DS . 'files' . DS . self::ATTACHMENT_ASSETS_DIR . DS . My_Upload_File::getDirName($messageId) . DS . $messageId . DS;
    }

    public function getPathToFile($messageId)
    {
        return self::getAttachmentsDirName($messageId);
    }

    public function saveMedias($media, $messageId, $title='') {

        if (!is_null($media)) {



            $imgModel = new Model_Hud_Attachments();
            $imgModel->setData(
                array(
                    'hud_object_id' => $messageId,
                    'type' => 'hud_medias',
                    'filename' => '',
                    'mediaId' => (int)$media->id
                )
            );

            $imgModel->save();

            $mediaObject = Model_Mapper_Media::getInstance()->find((int)$media->id);
            $mediaObject->title = $title;
            //var_dump($mediaObject);
            Model_Mapper_Media::getInstance()->save($mediaObject);



        }

    }

    public function saveImages(array $files, $messageId, $thenDelete = true)
    {
        //Move images from temp dir to specified dir

        foreach ($files as $path) {
            $dir = Model_Mapper_HudObject::getAttachmentsDirName($messageId);

            @mkdir($dir, 0777, true);
            if (!is_dir($dir)) {
                throw new Exception("Dir " . $dir . " was not created");
            } else {
                @chmod($dir, 0777);
            }

            if (!is_file($path)) {
                throw new Exception("File " . $path . " is not exist");
            }
            $fileInfo = pathinfo($path);
            $filePath = $this->getPathToFile($messageId) . $fileInfo['basename'];

            if (!copy($path, $filePath)) {
                throw new Exception("File " . $path . " was not uploaded");
                break;
            } else {


                $imgModel = new Model_Hud_Attachments();
                $imgModel->setData(
                    array(
                        'hud_object_id' => $messageId,
                        'type' => 'hud_image',
                        'filename' => basename($filePath)
                    )
                );

                $imgModel->save();
                //Remove file from tmp dir
                if ($thenDelete)
                {
                    unlink($path);
                }
            }
        }

    }

    public function saveVideo($messageId, $data)
    {
        //Move images from temp dir to specified dir


                $imgModel = new Model_Hud_Attachments();
                $imgModel->setData(
                    array(
                        'hud_object_id' => $messageId,
                        'type' => 'hud_video',
                        'mediaId' => $data
                    )
                );

                $imgModel->save();



    }


}