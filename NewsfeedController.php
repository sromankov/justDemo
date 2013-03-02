<?php
class NewsfeedController extends My_Controller_Action_Frontend
{
    protected $defaultLayout = 'profile';
    protected $_sectionWrapperClass = "user-three-columns";
    protected $_notShowForAuthorized = false;
    protected $_wrapContentToBlack = true;
    protected $loginRequired = false;

    protected $_albumTypeId = null;



    protected $searchRequired = false;

    public function disableLayout()
    {
        if ($this->getRequest()->isXmlHttpRequest()) {
            $this->_helper->layout()->disableLayout();
            $this->_helper->viewRenderer->setNoRender(true);
        }
    }

    public function init()
    {
        parent::init();
        $albumTypes = new Model_DbTable_AlbumTypes();
        $this->_albumTypeId = $albumTypes->findIdByType(Model_Mapper_Album::TYPE_WALL);

    }

    public function indexAction()
    {


        $this->view->hudOwnerId = My_Util_User::getUserId();

        $this->_helper->layout()->setLayout('profile_two_columns');


    }

    public function expandnextobjectsAction()
    {
        $this->disableLayout();

        $from = (int)$this->getRequest()->getParam('from');
        $hudOwnerId = (int)$this->getRequest()->getParam('hudowner');


        $lastUpdateTimeStamp = (int)$this->getRequest()->getParam('lastUpdateTimeStamp');


        if (My_Util_User::isAuthorized()) {
            $visitorId = My_Util_User::getUser()->user_id;
        }
        else {
            $visitorId = 0;
        }


        //if (My_Util_User::isAuthorized()) {
        if (true) {

            $objects = Model_Mapper_HudObject::getInstance()->getObjects($from,$hudOwnerId,$visitorId,$lastUpdateTimeStamp);

            $this->view->objects = $objects;
            //var_dump($objects);

            $maxLoadAmmount = Model_Mapper_HudObject::OBJECTS_PER_PAGE_AMOUNT;

            $position = $from;
            $globallist = array();
            $lastUpdateTimeStamp = 0;
            foreach ($objects as $object) {
                if  ($lastUpdateTimeStamp == 0) {
                    $lastUpdateTimeStamp = strtotime($object['hud_object_created_date']);
                    //$lastUpdateTime = $object['hud_object_created_date'];
                    //$lastUpdateTimeStamp = time();

                }
                $object['isRemovable'] = ($object['hud_object_owner_user_id'] == My_Util_User::getUserId());

                if ($position == $maxLoadAmmount + $from) {
                    $object['loaded'] = false;
                } else {
                    $object['loaded'] = true;
                }
                $object['position'] = $position;

                $this->view->object = $object;

                $item['id'] = $object['hud_object_id'];
                $eventEntity = $object['hud_object_referred_entity'];
                $eventObjectId = $object['hud_object_referred_id'];

                $poster = Model_Mapper_User::getInstance()->find($object['hud_object_poster_user_id']);

                if ($poster) {
                    $eventSender = $poster->username;
                } else {
                    $eventSender = $object['hud_object_poster_user_name'];
                }
                $this->view->eventSender = $eventSender;

                $this->view->link = $this->view->GetPageLinkByEntity($eventEntity, $eventObjectId, $eventSender);

                $hudObject = Model_Mapper_HudObject::getInstance()->find($object['hud_object_id']);
                $this->view->statistics = $hudObject->statistics;

                $action = $hudObject->action;
                $this->view->attachments = $hudObject->attachments;

                if (count($hudObject->attachments) ==1 ) {

                    $attachment = $hudObject->attachments[0];
                    $mediaId = $attachment->mediaId;
                    $media = Model_Mapper_Media::getInstance()->find($mediaId);
                    if ($media) {
                        $this->view->statistics = $media->statistics;
                    }
                    else {
                        $this->view->statistics->countLikes = 0;
                        $this->view->statistics->countComments = 0;

                    }

                }

                $this->view->owner = $hudObject->owner;

                if ($action->name) {
                    $objectTemplateKey = Model_Mapper_HudObject::HUD_TEMPLATE_PREFIX . $action->name;
                    $this->view->objectBody = $objectTemplateKey;
                    if ($this->view->object['loaded']) {
                        $item['rendered_object'] = $this->view->render("users.hud/object.tpl");
                    } else {
                        $item['rendered_object'] = $this->view->render("users.hud/see-more.tpl");
                    }
                    $globallist[] = $item;
                }
                $position++;

            }
            $this->getResponse()->setHeader('Content-type', 'text/json');
            $lastUpdateTimeStamp = time();
            $lastUpdateTimeStamp = strtotime(date("Y-m-d H:i:s T"));
            echo Zend_Json::encode(array('status' => 'ok', 'results' => $globallist, 'lastUpdateTimeStamp' => $lastUpdateTimeStamp));
        } else {
            $this->getResponse()->setHeader('Content-type', 'text/json');
            $lastUpdateTimeStamp = 0;
            echo Zend_Json::encode(array('status' => 'error', 'lastUpdateTimeStamp' => $lastUpdateTimeStamp));
        }

    }



    public function deleteobjectAction()
    {
        $this->disableLayout();

        $id = (int)$this->getRequest()->getParam('id');
        $user_id = My_Util_User::getUserId();
        $objectModel = Model_Mapper_HudObject::getInstance();

        $object = $objectModel->getOneObject($id);
        if ($user_id == $object->owner_user_id) {
            $object->is_deleted = 1;
            $objectModel->update($object);
            $this->getResponse()->setHeader('Content-type', 'text/json');
            echo Zend_Json::encode(array('status' => 'ok'));
        }

        else {
            $this->getResponse()->setHeader('Content-type', 'text/json');
            echo Zend_Json::encode(array('status' => 'false'));

        }

    }

    public function postImages($object, $files)
    {
        $hudModel = Model_Mapper_HudObject::getInstance();
        $albumMapper = Model_Mapper_Album::getInstance();
        $albumModel = $albumMapper->fetchRow(
            array(
                'album_type_id = ?' => $this->_albumTypeId,
                'user_id = ?' => $object->owner_user_id
            )
        );
        $mediaImages = $albumModel->saveImages($files);
        foreach ($mediaImages as $image) {
            $hudModel->saveMedias($image, $object->id, $object->post);
        }
    }

    public function postVideo($object, $post)
    {

        $hudModel = Model_Mapper_HudObject::getInstance();
        if ($post != '') {
            $albumMapper = Model_Mapper_Album::getInstance();
            $albumModel = $albumMapper->fetchRow(
                array(
                    'album_type_id = ?' => $this->_albumTypeId,
                    'user_id = ?' => $object->owner_user_id
                )
            );
            $mediaVideos = $albumModel->saveVideoLinks(array ($post));
            foreach ($mediaVideos as $mediaVideo) {
                $hudModel->saveMedias($mediaVideo, $object->id, $object->post);
            }
        }

    }

    public function saveAction()
    {
        $this->disableLayout();

        $lastUpdateTimeStamp = 0;
        if ($this->getRequest()->isPost()) {

            $post = $this->getRequest()->getPost();
            $user_id = $post['hud_object_poster_user_id'];
            $interlocutor_id = $post['hud_object_owner_user_id'];
            $user_post = $post['hud_object_post'];

            if ($user_id == My_Util_User::getUserId()) {

                if (Model_Mapper_HudObject::getInstance()->canWrite($user_id, $interlocutor_id)) {

                    $messageForm = Users_Forms_HudPost::getInstance($user_id, $interlocutor_id);

                    if ($messageForm->isValid($this->getRequest()->getPost())) {

                        $hudAction = 'publish_post';
                        $user_post = preg_replace('/(http[s]?:\/\/[^\s]*)/i', '<a href="$1">$1</a>', $user_post);

                        $objectO = Model_Mapper_HudObject::getInstance()
                            ->addHoodObject($user_id, $interlocutor_id, $user_post, 'hud', $interlocutor_id, $hudAction)->toArray();



                        if ($objectO) {

                            $object = array();
                            $object['hud_object_post'] = $objectO['post'];
                            $object['hud_object_poster_user_id'] = $objectO['poster_user_id'];
                            $object['hud_object_poster_user_name'] = $objectO['poster_user_name'];
                            $object['hud_object_owner_user_id'] = $objectO['owner_user_id'];
                            $object['hud_object_action_id'] = $objectO['action_id'];
                            $object['hud_object_referred_entity'] = $objectO['referred_entity'];
                            $object['hud_object_referred_id'] = $objectO['referred_id'];
                            $object['hud_object_created_date'] = $objectO['created_date'];
                            $object['hud_object_id'] = $objectO['id'];


                            $object['isRemovable'] = ($object['hud_object_owner_user_id'] == My_Util_User::getUserId());
                            $this->view->object = $object;

                            $item['id'] = $object['hud_object_id'];
                            $eventEntity = $object['hud_object_referred_entity'];
                            $eventObjectId = $object['hud_object_referred_id'];

                            $poster = Model_Mapper_User::getInstance()->find($object['hud_object_poster_user_id']);

                            if ($poster) {
                                $eventSender = $poster->username;
                            } else {
                                $eventSender = $object['hud_object_poster_user_name'];
                            }
                            $this->view->eventSender = $eventSender;
                            $this->view->link = $this->view->GetPageLinkByEntity($eventEntity, $eventObjectId, $eventSender);

                            $hudObject = Model_Mapper_HudObject::getInstance()->find($object['hud_object_id']);
                            $this->view->statistics = $hudObject->statistics;
                            $this->view->owner = $hudObject->owner;

                            if (isset($post['files']))
                            {
                                $this->postImages($hudObject, $post['files']);
                            }
                            if (isset($post['hudData']))
                            {
                                // video code
                                $this->postVideo($hudObject, $post['hudData']);
                            }

                            $this->view->attachments = $hudObject->attachments;

                            $objectTemplateKey = Model_Mapper_HudObject::HUD_TEMPLATE_PREFIX . $hudObject->action->name;
                            $this->view->objectBody = $objectTemplateKey;
                            $this->view->link = $this->view->GetPageLinkByEntity($eventEntity, $eventObjectId, $eventSender);
                            $rendered_object = $this->view->render("users.hud/object.tpl");


                            // add Points to registered user for wall posting
                            Model_Mapper_UserActionPoints::getInstance()->awardUser($object['hud_object_poster_user_id'], Model_Mapper_UserActionPoints::ACTION_WALL_POST);

                            // notification to the owner

                            if ($hudObject->owner->id != $hudObject->poster->id) {
                                $alreadyNotified = false;
                                if (isset($post['hudData']) && ($post['hudData'] !='') )
                                {
                                    $notificationAction = 'hud_video';
                                    $notification = Model_Mapper_Notification::getInstance()
                                        ->NotifyUser($hudObject->poster->id, $hudObject->owner->id, Model_Mapper_Notification::NOTIFICATIONCONTROLLER_NOTIFICATION_SOURCE_HUD, $hudObject->owner->id, $notificationAction);
                                    $alreadyNotified = true;
                                }
                                if (isset($post['files']))
                                {
                                    $notificationAction = 'hud_image';
                                    $notification = Model_Mapper_Notification::getInstance()
                                        ->NotifyUser($hudObject->poster->id, $hudObject->owner->id, Model_Mapper_Notification::NOTIFICATIONCONTROLLER_NOTIFICATION_SOURCE_HUD, $hudObject->owner->id, $notificationAction);
                                    $alreadyNotified = true;
                                }
                                if (!$alreadyNotified) {
                                    $notificationAction = 'hud_status';
                                    $notification = Model_Mapper_Notification::getInstance()
                                        ->NotifyUser($hudObject->poster->id, $hudObject->owner->id, Model_Mapper_Notification::NOTIFICATIONCONTROLLER_NOTIFICATION_SOURCE_HUD, $hudObject->owner->id, $notificationAction);
                                }

                            }





                            $lastUpdateTimeStamp = strtotime($hudObject->created_date);
                            //$lastUpdateTimeStamp = time();


                            $this->getResponse()->setHeader('Content-type', 'text/json');
                            echo Zend_Json::encode(array('status' => 'ok', 'objectid' => $object['hud_object_id'], 'rendered_object' => $rendered_object, 'lastUpdateTimeStamp' => $lastUpdateTimeStamp));

                        } else {
                            // this social object wasn't created, (no appropriate $hudAction, as an example reason)
                            $this->getResponse()->setHeader('Content-type', 'text/json');
                            echo Zend_Json::encode(array('status' => 'false','reason' => $this->view->translate('hud_configuration_error'), 'lastUpdateTimeStamp' => $lastUpdateTimeStamp));

                        }
                    } else {
                        // Form data isn't valid, passing error messages to the front-end application
                        $formErrors = $messageForm->getMessages();
                        $this->getResponse()->setHeader('Content-type', 'text/json');
                        echo Zend_Json::encode(array('status' => 'error', 'errors' => $formErrors));

                    }
                }
                else {
                    // user can't write on this hud due to the privacy settings
                    $this->getResponse()->setHeader('Content-type', 'text/json');
                    echo Zend_Json::encode(array('status' => 'false','reason' => $this->view->translate('hud_privacy_restrictions')));

                }
            } else {
                // fake userId
                $this->getResponse()->setHeader('Content-type', 'text/json');
                echo Zend_Json::encode(array('status' => 'false','reason' => $this->view->translate('hud_nice_try')));

            }
        }

    }

}